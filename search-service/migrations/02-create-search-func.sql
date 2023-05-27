DROP FUNCTION IF EXISTS search_app(_search char, _limit bigint, _offset bigint);
DROP FUNCTION IF EXISTS search_app(_search varchar, _limit bigint, _offset bigint);

CREATE OR REPLACE FUNCTION search_app(_search varchar, _limit bigint = 100, _offset bigint = 0) RETURNS TABLE (name varchar) AS $$
BEGIN RETURN QUERY
        SELECT app.name FROM app_documents app WHERE tsv @@ plainto_tsquery('english', _search)
        ORDER BY ts_rank(tsv, plainto_tsquery('english', _search)) DESC LIMIT _limit OFFSET _offset;
END; $$ 

LANGUAGE 'plpgsql';

