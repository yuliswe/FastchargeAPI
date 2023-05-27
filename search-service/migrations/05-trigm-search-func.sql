DROP FUNCTION IF EXISTS trigm_search_app(_search char, _limit bigint, _offset bigint);
DROP FUNCTION IF EXISTS trigm_search_app(_search varchar, _limit bigint, _offset bigint);
DROP FUNCTION IF EXISTS trigm_search_app(_search varchar, _limit bigint, _offset bigint, _threshold float8);
DROP FUNCTION IF EXISTS trigm_search_app(_search varchar, _limit bigint, _offset bigint, _threshold double precision);

CREATE OR REPLACE FUNCTION trigm_search_app(_search varchar, _limit bigint = 100, _offset bigint = 0, _threshold double precision = 0.3) RETURNS TABLE (name varchar, name_similarity real, title_similarity real, total_similarity real) AS $$
BEGIN RETURN QUERY
    SELECT 
        app.name as name, 
        word_similarity(_search, app.name) as name_similarity, 
        word_similarity(_search, COALESCE(app.title,'')) as title_similarity, 
        word_similarity(_search, app.name) + word_similarity(_search, COALESCE(app.title,'')) as total_similarity
    FROM app_documents app WHERE 
        word_similarity(_search, app.name) > _threshold OR 
        word_similarity(_search, COALESCE(app.title,'')) > _threshold
    ORDER BY total_similarity DESC
    LIMIT _limit OFFSET _offset;
END; $$ 

LANGUAGE 'plpgsql';

