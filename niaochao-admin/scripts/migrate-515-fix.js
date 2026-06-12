const mysql = require('mysql2/promise');

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

    const NEW_CUST = '2023391656704524699';
    const TID = '2057750945180004354';

    // Delete wrong task_id records (inserted with precision loss)
    const [wrong] = await ps.query('SELECT COUNT(*) as c FROM qc_record WHERE CAST(task_id AS CHAR)="2057750945180004400"');
    console.log('Wrong records:', wrong[0].c);
    await ps.query('DELETE FROM qc_record WHERE CAST(task_id AS CHAR)="2057750945180004400"');
    console.log('Deleted');

    // Get missing record_ids
    const [testRecs] = await ts.query('SELECT record_id FROM qc_record WHERE CAST(task_id AS CHAR)="' + TID + '"');
    const testIds = testRecs.map(r => r.record_id);
    const idList = testIds.map(r => "'" + r.replace(/'/g, "\\'") + "'").join(',');
    const [prodRecs] = await ps.query('SELECT record_id FROM qc_record WHERE record_id IN (' + idList + ')');
    const prodIds = new Set(prodRecs.map(r => r.record_id));
    const missing = testIds.filter(id => !prodIds.has(id));
    console.log('Missing:', missing.length);

    const cols = 'id,record_id,external_id,file_name,customer_id,scorecard_id,task_id,source,status,recording_url,recording_channels,recording_duration,recording_format,recording_size,transcribed_text,total_score,failure_stage,failure_reason,retry_count,has_manual_correction,last_corrected_by,last_corrected_at,review_status,reviewed_by,reviewed_at,processing_start_at,processing_end_at,webhook_last_event,webhook_last_status,create_time,update_time,create_by,update_by,batch_no,case_detail';

    const [maxRec] = await ps.query('SELECT MAX(id) as m FROM qc_record');
    let nextId = Number(maxRec[0].m) + 1;

    let inserted = 0;
    for (const rid of missing) {
        const [recs] = await ts.query(
            'SELECT CAST(id AS CHAR) as id, record_id, CAST(external_id AS CHAR) as external_id, file_name, ' +
            'scorecard_id, CAST(task_id AS CHAR) as task_id, source, status, recording_url, ' +
            'recording_channels, recording_duration, recording_format, recording_size, ' +
            'transcribed_text, total_score, failure_stage, failure_reason, retry_count, ' +
            'has_manual_correction, last_corrected_by, last_corrected_at, review_status, ' +
            'reviewed_by, reviewed_at, processing_start_at, processing_end_at, ' +
            'webhook_last_event, webhook_last_status, create_time, update_time, ' +
            'create_by, update_by, batch_no, case_detail ' +
            'FROM qc_record WHERE record_id=' + mysql.escape(rid)
        );
        if (!recs.length) continue;
        const r = recs[0];

        const vals = [
            nextId,
            mysql.escape(r.record_id),
            mysql.escape(r.external_id),
            mysql.escape(r.file_name),
            NEW_CUST,
            r.scorecard_id,
            r.task_id,
            r.source,
            r.status,
            mysql.escape(r.recording_url),
            r.recording_channels || 'NULL',
            r.recording_duration || 'NULL',
            mysql.escape(r.recording_format),
            r.recording_size || 'NULL',
            mysql.escape(r.transcribed_text),
            r.total_score || 'NULL',
            r.failure_stage || 'NULL',
            mysql.escape(r.failure_reason),
            r.retry_count || 0,
            r.has_manual_correction || 0,
            mysql.escape(r.last_corrected_by),
            mysql.escape(r.last_corrected_at),
            r.review_status || 'NULL',
            mysql.escape(r.reviewed_by),
            mysql.escape(r.reviewed_at),
            mysql.escape(r.processing_start_at),
            mysql.escape(r.processing_end_at),
            mysql.escape(r.webhook_last_event),
            r.webhook_last_status || 'NULL',
            mysql.escape(r.create_time),
            mysql.escape(r.update_time),
            mysql.escape(r.create_by),
            mysql.escape(r.update_by),
            mysql.escape(r.batch_no),
            mysql.escape(r.case_detail),
        ];

        try {
            await ps.query('INSERT INTO qc_record (' + cols + ') VALUES (' + vals.join(',') + ')');
            nextId++;
            inserted++;
        } catch (e) {
            console.error('Fail:', rid, e.sqlMessage ? e.sqlMessage.substring(0, 100) : e.message);
        }
    }
    console.log('Inserted:', inserted);

    // Final verify
    const TIDS = ['2057750945180004354', '2057739101828657154', '2057760105112121345', '2057638522812985345'];
    let total = 0;
    for (const tid of TIDS) {
        const [r] = await ps.query('SELECT COUNT(*) as c FROM qc_record WHERE CAST(task_id AS CHAR)="' + tid + '"');
        total += r[0].c;
        console.log('Task ' + tid + ': ' + r[0].c);
    }
    console.log('Total: ' + total + ' (expected 704)');

    await ts.end();
    await ps.end();
})();
