# maker-cloud.squirrel for electron forge


## Discover Notes


- > I don't use hardware code-signing myself, but I did test and take a look at some code signing improvements ages ago in the cs/better-signing branch. we could try to bring some of those changes back in to the main branches. In my testing, signtool.exe could sign 10 exe's at once. any more than that and I started running into intermittent signing issues. Another improvement we could make is stop signing dll's. anti-viruses, as far as I know, don't know or care that dll's are unsigned. -@caesay

- >cloud squirrel command to bundle an app. -@caesay
  ```bash
  Squirrel.exe pack -u MyApp -v 1.0.0 -p "path-to/app-files"
  ```

- >build a version of clowd.squirrel to include with electron -@caesay

  ```bash
  dotnet publish .\src\Squirrel.Tool\Squirrel.Tool.csproj -c Release -r win-x64 --self-contained /p:PublishSingleFile=true -o .\testTool /p:GeneratePackageOnBuild=false /p:PublishTrimmed=true /p:EnableCompressionInSingleFile=true
  ```