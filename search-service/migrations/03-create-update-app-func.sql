DROP FUNCTION IF EXISTS update_app(_name char, _title char, _description char);
DROP FUNCTION IF EXISTS update_app(_name varchar, _title varchar, _description varchar);
DROP FUNCTION IF EXISTS update_app(_name varchar, _title varchar, _description varchar, _tags varchar, _github_popularity int);

CREATE OR REPLACE FUNCTION update_app(
    _name varchar, 
    _title varchar, 
    _description varchar, 
    _tags varchar, 
    _github_popularity bigint
) RETURNS SETOF varchar 
AS $$
BEGIN RETURN QUERY
    INSERT INTO app_documents (name, title, description, tags, github_popularity) 
        VALUES (_name, _title, _description, _tags, _github_popularity)
    ON CONFLICT (name) 
    DO UPDATE 
        SET 
            title = _title, 
            description = _description,
            tags = _tags,
            github_popularity = _github_popularity
    RETURNING name;
END
$$ LANGUAGE 'plpgsql';
