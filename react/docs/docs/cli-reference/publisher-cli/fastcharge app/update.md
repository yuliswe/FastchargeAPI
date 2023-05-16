# update

Update attributes of an app.

## Usage

```bash
fastcharge app update [APP_NAME]
```


## Arguments:

### APP_NAME

Type: string. Required.

Name of the app to be updated.


## Available options:

### --visibility ENUM

Value: `public, private`. Optional.

Make the app visible to the public. A public app will show up in the search
result. A private app is hidden from the search result, and users cannot
subscribe to it.

```bash
--visibility private
```

### --description STRING

Type: string. Optional.

Add a short description for the app. The description will show up in the app
search result.

```bash
--description "A demo API app"
```

### --repository URL

Type: URL. Optional.

Provide a URL to the github repository of the app.

```bash
--repository "https://github.com/exampleuser/examporepo"
```

### --homepage URL

Type: URL. Optional.

Provide a URL to the project home page of the app.

```bash
--homepage "https://myproject.com"
```

### --readme URL

Type: URL. Optional. Recommanded.

Provide a URL to a README.md file that contains documentation for the app.

This can be the url to the file in your github repo:

```bash
--readme "https://github.com/exampleuser/examporepo/blob/main/README.md"
```

Or can be any url to a markdown file:

```bash
--readme "https://raw.githubusercontent.com/exampleuser/examporepo/main/README.md"
--readme "https://myproject.com/files/README.md"
```

If the file comes from a source other than `raw.githubusercontent.com`, you need
to ensure that the file can be access by a CORS request from https://fastchargeapi.com.





