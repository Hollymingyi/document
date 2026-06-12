const mysql = require('mysql2/promise');
const fs = require('fs');

const OLD_CUST = '2023391656704524800';
const NEW_CUST = '2023391656704524699';
const TASK_IDS = ['2057750945180004354', '2057739101828657154', '2057760105112121345'];

function esc(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'string') return "'" + val.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    if (val instanceof Date) return "'" + val.toISOString().replace('T', ' ').substring(0, 19) + "'";
    return String(val);
}

(async () => {
    const ts = await mysql.createConnection({
        host: '218.94.137.178', port: 29030, user: 'root',
        password: 'U3RhclJvY2tzUWluWGlhMjAyNjA1IyMj',
        database: 'market', decimalNumbers: true
    });
    const ps = await mysql.createConnection({
        host: '47.117.85.102', port: 9030, user: 'root',
        password: '!Q@W#E$R98765',
        database: 'market', decimalNumbers: true
    });

    // 1. Export records from test
    const allRecords = [];
    const idMap = {};
    for (const tid of TASK_IDS) {
        const [recs] = await ts.query(
            "SELECT CAST(id AS CHAR) as id, record_id, CAST(external_id AS CHAR) as external_id, file_name, " +
            "scorecard_id, CAST(task_id AS CHAR) as task_id, " +
            "source, status, recording_url, recording_channels, recording_duration, recording_format, " +
            "recording_size, transcribed_text, total_score, failure_stage, failure_reason, retry_count, " +
            "has_manual_correction, review_status, processing_start_at, processing_end_at, " +
            "create_time, update_time, create_by, update_by, batch_no, case_detail " +
            "FROM qc_record WHERE task_id=" + tid);
        allRecords.push(...recs);
    }
    console.log('Records:', allRecords.length);

    // 2. Get max IDs
    const [maxRec] = await ps.query('SELECT MAX(id) as m FROM qc_record');
    const [maxHit] = await ps.query('SELECT MAX(id) as m FROM qc_record_hit');
    let nextRecId = Number(maxRec[0].m) + 1;
    let nextHitId = Number(maxHit[0].m) + 1;
    console.log('Next rec id:', nextRecId, 'Next hit id:', nextHitId);

    // 3. Build id mapping
    for (const rec of allRecords) {
        idMap[rec.id] = String(nextRecId);
        nextRecId++;
    }

    // 4. Export hits
    const allRecIds = allRecords.map(r => r.id);
    const allHits = [];
    for (let i = 0; i < allRecIds.length; i += 50) {
        const batch = allRecIds.slice(i, i + 50);
        const idList = batch.join(',');
        const [hits] = await ts.query(
            "SELECT CAST(id AS CHAR) as id, CAST(record_id AS CHAR) as record_id, " +
            "score_item_id, rule_id, hit, responsible, hit_source, accurate, score_earned, " +
            "trigger_text, time_offset, trigger_text_highlighted, " +
            "create_by, create_time, update_by, update_time " +
            "FROM qc_record_hit WHERE record_id IN (" + idList + ")");
        allHits.push(...hits);
    }
    console.log('Hits:', allHits.length);

    // 5. Generate SQL
    let sql = "-- Migrate qc_record (198 rows) --\n";
    sql += "-- customer_id remapped: " + OLD_CUST + " -> " + NEW_CUST + " --\n\n";

    const recColumns = "id,record_id,external_id,file_name,customer_id,scorecard_id,task_id,source,status,recording_url,recording_channels,recording_duration,recording_format,recording_size,transcribed_text,total_score,failure_stage,failure_reason,retry_count,has_manual_correction,review_status,processing_start_at,processing_end_at,create_time,update_time,create_by,update_by,batch_no,case_detail";

    for (let i = 0; i < allRecords.length; i += 20) {
        const batch = allRecords.slice(i, i + 20);
        const rows = batch.map(r => [
            idMap[r.id],
            esc(r.record_id),
            esc(r.external_id),
            esc(r.file_name),
            NEW_CUST,
            r.scorecard_id,
            r.task_id,
            r.source,
            r.status,
            esc(r.recording_url),
            r.recording_channels || 'NULL',
            r.recording_duration || 'NULL',
            esc(r.recording_format),
            r.recording_size || 'NULL',
            esc(r.transcribed_text),
            r.total_score || 'NULL',
            r.failure_stage || 'NULL',
            esc(r.failure_reason),
            r.retry_count || 0,
            r.has_manual_correction || 0,
            r.review_status || 'NULL',
            esc(r.processing_start_at),
            esc(r.processing_end_at),
            esc(r.create_time),
            esc(r.update_time),
            esc(r.create_by),
            esc(r.update_by),
            esc(r.batch_no),
            esc(r.case_detail),
        ].join(','));
        sql += "INSERT INTO qc_record (" + recColumns + ") VALUES\n(" + rows.join("),\n(") + ");\n\n";
    }

    // 6. Hit id mapping
    const hitIdMap = {};
    for (const h of allHits) {
        hitIdMap[h.id] = String(nextHitId);
        nextHitId++;
    }

    sql += "-- Migrate qc_record_hit (118 rows) --\n\n";
    const hitColumns = "id,record_id,score_item_id,rule_id,hit,responsible,hit_source,accurate,score_earned,trigger_text,time_offset,trigger_text_highlighted,create_by,create_time,update_by,update_time";

    for (let i = 0; i < allHits.length; i += 50) {
        const batch = allHits.slice(i, i + 50);
        const rows = batch.map(h => [
            hitIdMap[h.id],
            idMap[h.record_id],
            h.score_item_id || 'NULL',
            h.rule_id || 'NULL',
            h.hit || 0,
            h.responsible || 'NULL',
            h.hit_source || 1,
            h.accurate || 1,
            h.score_earned || 'NULL',
            esc(h.trigger_text),
            esc(h.time_offset),
            esc(h.trigger_text_highlighted),
            esc(h.create_by),
            esc(h.create_time),
            esc(h.update_by),
            esc(h.update_time),
        ].join(','));
        sql += "INSERT INTO qc_record_hit (" + hitColumns + ") VALUES\n(" + rows.join("),\n(") + ");\n\n";
    }

    // 7. Update task counts
    sql += "-- Update task counts --\n";
    const taskCounts = {};
    for (const r of allRecords) {
        const tid = r.task_id;
        if (!taskCounts[tid]) taskCounts[tid] = { total: 0, success: 0, fail: 0 };
        taskCounts[tid].total++;
        if (r.status === 5) taskCounts[tid].success++;
        if (r.status === 6) taskCounts[tid].fail++;
    }
    for (const [tid, counts] of Object.entries(taskCounts)) {
        sql += "UPDATE qc_task SET total_count = total_count + " + counts.total +
            ", success_count = success_count + " + counts.success +
            ", fail_count = fail_count + " + counts.fail +
            " WHERE id = " + tid + ";\n";
    }
    sql += "\n-- Regenerate billing stats after execution:\n";
    sql += "-- POST /qcDailyStat/generate?date=2026-05-21\n";

    fs.writeFileSync('plans/515-migrate.sql', sql);
    console.log('SQL saved to plans/515-migrate.sql');
    console.log('Rec IDs:', Object.values(idMap)[0], '-', Object.values(idMap).slice(-1)[0]);
    console.log('Hit IDs:', Object.values(hitIdMap)[0], '-', Object.values(hitIdMap).slice(-1)[0]);

    await ts.end();
    await ps.end();
})();
