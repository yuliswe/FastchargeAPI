DROP FUNCTION IF EXISTS trigm_search_app(_search varchar, _tag varchar, _orderBy varchar, _limit bigint, _offset bigint, _threshold double precision);

CREATE OR REPLACE FUNCTION trigm_search_app(
    _search varchar = '', 
    _tag varchar = '', 
    _orderBy varchar = 'exact_match', 
    _limit bigint = 100, 
    _offset bigint = 0, 
    _threshold double precision = 0.3
) RETURNS TABLE (
    name varchar, 
    name_similarity real,
    title_similarity real, 
    total_similarity real
) 
AS $$
BEGIN RETURN QUERY
    SELECT 
        app.name as name, 
        word_similarity(_search, app.name) as name_similarity, 
        word_similarity(_search, COALESCE(app.title,'')) as title_similarity, 
        word_similarity(_search, app.name) + word_similarity(_search, COALESCE(app.title,'')) as total_similarity
    FROM app_documents app WHERE 
        (
            CASE WHEN LTRIM(RTRIM(COALESCE(_tag,''))) = '' THEN true ELSE word_similarity(_tag, COALESCE(app.tags,'')) > _threshold END
        ) AND (
            CASE 
                WHEN LTRIM(RTRIM(COALESCE(_search,''))) = '' THEN true 
                ELSE (
                    word_similarity(_search, app.name) > _threshold OR 
                    word_similarity(_search, COALESCE(app.title,'')) > _threshold
                )
            END
        )
    ORDER BY 
        CASE 
            WHEN _orderBy = 'github_popularity' THEN app.github_popularity
            ELSE total_similarity 
        END, total_similarity
    DESC
    LIMIT _limit OFFSET _offset;
END; $$ 

LANGUAGE 'plpgsql';

