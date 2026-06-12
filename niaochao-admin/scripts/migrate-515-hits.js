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

    const TIDS = ['2057750945180004354', '2057739101828657154', '2057760105112121345'];

    // Two-level mapping: test_qc_record.id -> business record_id -> prod_qc_record.id
    const testIdToRecId = {};
    for (const tid of TIDS) {
        const [recs] = await ts.query(
            'SELECT CAST(id AS CHAR) as id, record_id FROM qc_record WHERE CAST(task_id AS CHAR)="' + tid + '"');
        for (const r of recs) testIdToRecId[r.id] = r.record_id;
    }

    const recIdToProdId = {};
    for (const tid of TIDS) {
        const [recs] = await ps.query(
            'SELECT CAST(id AS CHAR) as id, record_id FROM qc_record WHERE CAST(task_id AS CHAR)="' + tid + '"');
        for (const r of recs) recIdToProdId[r.record_id] = r.id;
    }

    function toProdId(testInternalId) {
        const recId = testIdToRecId[String(testInternalId)];
        if (!recId) return null;
        return recIdToProdId[recId] || null;
    }

    // Get all hits from test for these tasks
    const allHits = [];
    for (const tid of TIDS) {
        const [hits] = await ts.query(
            'SELECT CAST(h.id AS CHAR) as hit_id, CAST(h.record_id AS CHAR) as test_rec_id, ' +
            'h.score_item_id, h.rule_id, h.hit, h.responsible, h.hit_source, h.accurate, h.score_earned, ' +
            'h.trigger_text, h.time_offset, h.trigger_text_highlighted, ' +
            'h.create_by, h.create_time, h.update_by, h.update_time ' +
            'FROM qc_record_hit h ' +
            'JOIN qc_record r ON h.record_id = r.id ' +
            'WHERE CAST(r.task_id AS CHAR)="' + tid + '"'
        );
        allHits.push(...hits);
    }
    console.log('Test hits:', allHits.length);

    // Count existing hits in prod
    let existingCount = 0;
    for (const [recId, prodId] of Object.entries(recIdToProdId)) {
        const [h] = await ps.query('SELECT COUNT(*) as c FROM qc_record_hit WHERE CAST(record_id AS CHAR)="' + prodId + '"');
        existingCount += h[0].c;
    }
    console.log('Existing hits:', existingCount);

    // Get next hit id
    const [maxHit] = await ps.query('SELECT MAX(id) as m FROM qc_record_hit');
    let nextHitId = Number(maxHit[0].m) + 1;

    const hitCols = 'id,record_id,score_item_id,rule_id,hit,responsible,hit_source,accurate,score_earned,trigger_text,time_offset,trigger_text_highlighted,create_by,create_time,update_by,update_time';

    let inserted = 0, skipped = 0;
    for (const h of allHits) {
        const prodRecId = toProdId(h.test_rec_id);
        if (!prodRecId) { skipped++; continue; }

        // Check if exists
        const [ex] = await ps.query(
            'SELECT COUNT(*) as c FROM qc_record_hit WHERE CAST(record_id AS CHAR)="' + prodRecId + '"' +
            ' AND score_item_id=' + (h.score_item_id || 'NULL') +
            ' AND rule_id=' + (h.rule_id || 'NULL')
        );
        if (ex[0].c > 0) { skipped++; continue; }

        const vals = [
            nextHitId,
            prodRecId,
            h.score_item_id || 'NULL',
            h.rule_id || 'NULL',
            h.hit || 0,
            h.responsible || 'NULL',
            h.hit_source || 1,
            h.accurate || 1,
            h.score_earned || 'NULL',
            mysql.escape(h.trigger_text),
            mysql.escape(h.time_offset),
            mysql.escape(h.trigger_text_highlighted),
            mysql.escape(h.create_by),
            mysql.escape(h.create_time),
            mysql.escape(h.update_by),
            mysql.escape(h.update_time),
        ];

        try {
            await ps.query('INSERT INTO qc_record_hit (' + hitCols + ') VALUES (' + vals.join(',') + ')');
            nextHitId++; inserted++;
            if (inserted % 20 === 0) console.log('Inserted:', inserted);
        } catch (e) {
            console.error('Fail:', h.hit_id, e.sqlMessage ? e.sqlMessage.substring(0, 80) : e.message);
            skipped++;
        }
    }
    console.log('Inserted:', inserted, 'Skipped:', skipped);

    // Final verify
    let totalHits = 0;
    for (const prodId of Object.values(recIdToProdId)) {
        const [h] = await ps.query('SELECT COUNT(*) as c FROM qc_record_hit WHERE CAST(record_id AS CHAR)="' + prodId + '"');
        totalHits += h[0].c;
    }
    console.log('Total hits:', totalHits, '(expected 118)');

    await ts.end();
    await ps.end();
})();
