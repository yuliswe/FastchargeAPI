CREATE TABLE app_documents (
    name CHAR(64) NOT NULL UNIQUE PRIMARY KEY,
    title CHAR(64),
    description CHAR(300),
    tsv TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') || 
        setweight(to_tsvector('english', COALESCE(title, '')), 'B') ||  
        setweight(to_tsvector('english', COALESCE(description, '')), 'C')
    ) STORED
);
