const mysql = require('mysql2/promise');
const NEW_CUST = '2023391656704524699';
const TASK_IDS = ['2058729691823329282', '2058742007956623362', '2058742394373656577'];

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

    // Step 1: Get next IDs
    const [maxRec] = await ps.query('SELECT MAX(id) as m FROM qc_record');
    const [maxHit] = await ps.query('SELECT MAX(id) as m FROM qc_record_hit');
    let nextRecId = Number(maxRec[0].m) + 1;
    let nextHitId = Number(maxHit[0].m) + 1;
    console.log('Next rec id:', nextRecId, 'Next hit id:', nextHitId);

    // Step 2: Export missing records from test
    const allRecords = [];
    const recIdMap = {}; // test_internal_id -> new_prod_id

    for (const tid of TASK_IDS) {
        const [recs] = await ts.query(
            'SELECT CAST(id AS CHAR) as id, record_id, CAST(external_id AS CHAR) as external_id, file_name, ' +
            'scorecard_id, CAST(task_id AS CHAR) as task_id, source, status, recording_url, ' +
            'recording_channels, recording_duration, recording_format, recording_size, ' +
            'transcribed_text, total_score, failure_stage, failure_reason, retry_count, ' +
            'has_manual_correction, last_corrected_by, last_corrected_at, review_status, ' +
            'reviewed_by, reviewed_at, processing_start_at, processing_end_at, ' +
            'webhook_last_event, webhook_last_status, create_time, update_time, ' +
            'create_by, update_by, batch_no, case_detail ' +
            'FROM qc_record WHERE CAST(task_id AS CHAR)="' + tid + '"'
        );
        for (const r of recs) {
            recIdMap[r.id] = String(nextRecId);
            r._new_id = String(nextRecId);
            nextRecId++;
        }
        allRecords.push(...recs);
        console.log('Task', tid, ':', recs.length, 'records');
    }
    console.log('Total records to insert:', allRecords.length);

    // Step 3: Insert records
    const recCols = 'id,record_id,external_id,file_name,customer_id,scorecard_id,task_id,source,status,recording_url,recording_channels,recording_duration,recording_format,recording_size,transcribed_text,total_score,failure_stage,failure_reason,retry_count,has_manual_correction,last_corrected_by,last_corrected_at,review_status,reviewed_by,reviewed_at,processing_start_at,processing_end_at,webhook_last_event,webhook_last_status,create_time,update_time,create_by,update_by,batch_no,case_detail';

    let recOk = 0, recFail = 0;
    for (const r of allRecords) {
        const vals = [
            r._new_id,
            mysql.escape(r.record_id), mysql.escape(r.external_id), mysql.escape(r.file_name),
            NEW_CUST, r.scorecard_id, r.task_id, r.source, r.status,
            mysql.escape(r.recording_url),
            r.recording_channels || 'NULL', r.recording_duration || 'NULL',
            mysql.escape(r.recording_format), r.recording_size || 'NULL',
            mysql.escape(r.transcribed_text), r.total_score || 'NULL',
            r.failure_stage || 'NULL', mysql.escape(r.failure_reason),
            r.retry_count || 0, r.has_manual_correction || 0,
            mysql.escape(r.last_corrected_by), mysql.escape(r.last_corrected_at),
            r.review_status || 'NULL', mysql.escape(r.reviewed_by), mysql.escape(r.reviewed_at),
            mysql.escape(r.processing_start_at), mysql.escape(r.processing_end_at),
            mysql.escape(r.webhook_last_event), r.webhook_last_status || 'NULL',
            mysql.escape(r.create_time), mysql.escape(r.update_time),
            mysql.escape(r.create_by), mysql.escape(r.update_by),
            mysql.escape(r.batch_no), mysql.escape(r.case_detail),
        ];
        try {
            await ps.query('INSERT INTO qc_record (' + recCols + ') VALUES (' + vals.join(',') + ')');
            recOk++;
            if (recOk % 100 === 0) console.log('Records:', recOk);
        } catch (e) {
            recFail++;
            console.error('Rec fail:', r.record_id, e.sqlMessage ? e.sqlMessage.substring(0, 80) : e.message);
        }
    }
    console.log('Records inserted:', recOk, 'failed:', recFail);

    // Step 4: Export hits from test
    const allHits = [];
    for (const tid of TASK_IDS) {
        const [hits] = await ts.query(
            'SELECT CAST(h.id AS CHAR) as hid, CAST(h.record_id AS CHAR) as rid, ' +
            'h.score_item_id, h.rule_id, h.hit, h.responsible, h.hit_source, h.accurate, h.score_earned, ' +
            'h.trigger_text, h.time_offset, h.trigger_text_highlighted, ' +
            'h.create_by, h.create_time, h.update_by, h.update_time ' +
            'FROM qc_record_hit h JOIN qc_record r ON h.record_id = r.id ' +
            'WHERE CAST(r.task_id AS CHAR)="' + tid + '"'
        );
        allHits.push(...hits);
    }
    console.log('Hits to insert:', allHits.length);

    // Step 5: Insert hits
    const hitCols = 'id,record_id,score_item_id,rule_id,hit,responsible,hit_source,accurate,score_earned,trigger_text,time_offset,trigger_text_highlighted,create_by,create_time,update_by,update_time';

    let hitOk = 0, hitSkip = 0, hitFail = 0;
    for (const h of allHits) {
        const newRecId = recIdMap[h.rid];
        if (!newRecId) { hitSkip++; continue; }

        const vals = [
            nextHitId, newRecId,
            h.score_item_id || 'NULL', h.rule_id || 'NULL',
            h.hit || 0, h.responsible || 'NULL', h.hit_source || 1, h.accurate || 1,
            h.score_earned || 'NULL',
            mysql.escape(h.trigger_text), mysql.escape(h.time_offset),
            mysql.escape(h.trigger_text_highlighted),
            mysql.escape(h.create_by), mysql.escape(h.create_time),
            mysql.escape(h.update_by), mysql.escape(h.update_time),
        ];
        try {
            await ps.query('INSERT INTO qc_record_hit (' + hitCols + ') VALUES (' + vals.join(',') + ')');
            nextHitId++; hitOk++;
            if (hitOk % 100 === 0) console.log('Hits:', hitOk);
        } catch (e) {
            hitFail++;
            console.error('Hit fail:', h.hid, e.sqlMessage ? e.sqlMessage.substring(0, 80) : e.message);
        }
    }
    console.log('Hits inserted:', hitOk, 'skipped:', hitSkip, 'failed:', hitFail);

    // Step 6: Update task counts
    for (const tid of TASK_IDS) {
        const [r] = await ps.query(
            'SELECT COUNT(*) as t, SUM(CASE WHEN status=5 THEN 1 ELSE 0 END) as s, ' +
            'SUM(CASE WHEN status=6 THEN 1 ELSE 0 END) as f FROM qc_record WHERE CAST(task_id AS CHAR)="' + tid + '"'
        );
        await ps.query(
            'UPDATE qc_task SET total_count=' + r[0].t + ', success_count=' + r[0].s +
            ', fail_count=' + r[0].f + ', processing_count=0 WHERE CAST(id AS CHAR)="' + tid + '"'
        );
        console.log('Task', tid, 'updated: t=' + r[0].t + ' s=' + r[0].s + ' f=' + r[0].f);
    }

    // Step 7: Verify
    let totalRecords = 0, totalHits = 0;
    for (const tid of TASK_IDS) {
        const [rc] = await ps.query('SELECT COUNT(*) as c FROM qc_record WHERE CAST(task_id AS CHAR)="' + tid + '"');
        const [hc] = await ps.query(
            'SELECT COUNT(*) as c FROM qc_record_hit h JOIN qc_record r ON h.record_id=r.id ' +
            'WHERE CAST(r.task_id AS CHAR)="' + tid + '"'
        );
        totalRecords += rc[0].c; totalHits += hc[0].c;
        console.log('  Task ' + tid + ': ' + rc[0].c + ' records, ' + hc[0].c + ' hits');
    }
    console.log('Total: ' + totalRecords + ' records, ' + totalHits + ' hits');

    await ts.end();
    await ps.end();
})();
