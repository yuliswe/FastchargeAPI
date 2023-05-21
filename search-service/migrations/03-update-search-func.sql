DROP FUNCTION IF EXISTS update_app(_name char, _title char, _description char);

CREATE OR REPLACE FUNCTION update_app(_name char, _title char, _description char) RETURNS SETOF char AS $$
BEGIN RETURN QUERY
    INSERT INTO app_documents (name, title, description) VALUES (_name, _title, _description)
    ON CONFLICT (name) 
    DO UPDATE 
        SET 
            title = _title, 
            description = _description
    RETURNING name;
END
$$ LANGUAGE 'plpgsql';
