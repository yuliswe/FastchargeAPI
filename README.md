# Start development

## MacOS

Run once:

```
./initenv.bash
```

Run this at start of terminal:

```
source ./devenv.bash
```

## Ports commonly used for local development

* GraphQL Apollo: http://localhost:4000
* ReactJs frontend: http://localhost:8000
* Gateway service `sam local start-api -p 5000`: http://localhost:5000
* Payment service `sam local start-api -p 3000`: http://localhost:3000
* DynamoDB `docker compose -f ./dynamodb.yml up`: http://localhost:9000

## Testing

* For testing, add 1 to all ports. For example, 4000 becomes 4001.
  
