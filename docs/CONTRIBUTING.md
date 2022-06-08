# How to Contribute

You contributions are welcome.

To contribute, fork this repo, create a feature branch, make your changes, then submit a PR.

To keep your PR up to date, please rebase it on the target branch and resolve any conflicts. Do not merge the target branch into your feature branch.  If that sounds confusing read https://www.atlassian.com/git/tutorials/merging-vs-rebasing.

## Testing

* ./test/fixtures/fixture-win32-x64 - contains the packaged output of an electron app named fixture for packing.

packing with squirrel (this will create a nuget package and releasify it)
```
./vendor/SquirrelTools/Squirrel.exe pack -r ./test/out/pack -u fixture -v 1.0.0 -p ./test/fixtures/fixture-win32-x64 --packTitle=fixtureTitle --packAuthors=fixtureAuthors  -s ./test/fixtures/Squirrel-Clowd-Logo.png -i test/fixtures/Squirrel-Clowd-Logo.ico --appIcon=test/fixtures/electron.ico
```

add for code signing test, update for your local signing cert
```
-n '/fd sha256 /tr "http://ts.ssl.com" /td sha256 /sha1 "321686E5F818DB019FC43E2B2B2FCD2D6B7AFF60"'
```


