CREATE TABLE app_documents (
    name VARCHAR(64) NOT NULL UNIQUE PRIMARY KEY,
    title VARCHAR(64),
    description VARCHAR(300),
    tsv TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') || 
        setweight(to_tsvector('english', COALESCE(title, '')), 'B') ||  
        setweight(to_tsvector('english', COALESCE(description, '')), 'C')
    ) STORED
);
