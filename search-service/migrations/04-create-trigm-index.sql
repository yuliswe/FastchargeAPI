CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY index_app_documents_name
ON app_documents
USING GIN (name gin_trgm_ops);


CREATE INDEX CONCURRENTLY index_app_documents_title
ON app_documents
USING GIN (title gin_trgm_ops);
