import { spawnSync, SpawnSyncOptionsWithStringEncoding } from 'child_process';
import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import path from 'path';

export type ClowdSquirrelFramework =
  | 'net45'
  | 'net451'
  | 'net452'
  | 'net46'
  | 'net461'
  | 'net462'
  | 'net47'
  | 'net471'
  | 'net472'
  | 'net48'
  | 'netcoreapp3.1-x86'
  | 'netcoreapp3.1-x64'
  | 'net5.0-x86'
  | 'net5.0-x64'
  | 'net6.0-x86'
  | 'net6.0-x64'
  | 'vcredist100-x86'
  | 'vcredist100-x64'
  | 'vcredist110-x86'
  | 'vcredist110-x64'
  | 'vcredist120-x86'
  | 'vcredist120-x64'
  | 'vcredist140-x86'
  | 'vcredist140-x64'
  | 'vcredist141-x86'
  | 'vcredist141-x64'
  | 'vcredist142-x86'
  | 'vcredist142-x64'
  | 'vcredist143-x86'
  | 'vcredist143-x64';

export type ClowdSquirrelMSI = 'x86' | 'x64';

export function convertVersion(version: string): string {
  const parts = version.split('-');
  const mainVersion = parts.shift();

  if (parts.length > 0) {
    return [mainVersion, parts.join('-').replace(/\./g, '')].join('-');
  } else {
    return mainVersion as string;
  }
}

export interface SigningOptions {
  signParams: string;
  signTemplate: string;
}

export interface ReleasifyOptions {
  // releasify options
  baseUrl?: string; // Provides a base URL to prefix the RELEASES file packages with
  addSearchPath?: string; // Add additional search directories when looking for helper exe's such as Setup.exe, Update.exe, etc
  debugSetupExe?: string; // Uses the Setup.exe at this {PATH} to create the bundle, and then replaces it with the bundle.
  package?: string; // {PATH} to a '.nupkg' package to releasify
  noDelta?: string; // Skip the generation of delta packages
  framework?: ClowdSquirrelFramework; // net6,vcredist143-x86`  # Install .NET 6.0 (x64) and vcredist143 (x86) during setup, if not installed
  splashImage?: string; // The splash artwork (or animation) to be shown during install
  icon?: string; // {PATH} to .ico for Setup.exe and Update.exe
  mainExes?: string[]; // {NAME} of one or more SquirrelAware executables
  appIcon?: string; // {PATH} to .ico for 'Apps and Features' list
  msi?: ClowdSquirrelMSI; // Compile a .msi machine-wide deployment tool with the specified {BITNESS}. (either 'x86' or 'x64')
}

export interface PackOptions extends Omit<ReleasifyOptions, 'package'> {
  // pack options
  packId?: string; // Application / package name
  packVersion?: string; // Version to build. Should be supplied by your CI
  packDir?: string; // The directory the application was published to
  packTitle?: string; // Optional display/friendly {NAME} for release
  packAuthors?: string; // Your name, or your company name
  includePdb?: boolean; // Add *.pdb files to release package
  releaseNotes?: string; // {PATH} to file with markdown notes for version
}

export interface MakerClowdSquirrelConfig extends PackOptions, SigningOptions {}

export default class MakerClowdSquirrel extends MakerBase<MakerClowdSquirrelConfig> {
  name = 'Clowd.Squirrel';

  defaultPlatforms: ForgePlatform[] = ['win32'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'win32';
  }

  async make({
    dir,
    makeDir,
    targetArch,
    packageJSON,
    appName,
    forgeConfig,
  }: MakerOptions): Promise<string[]> {
    const outPath = path.resolve(makeDir, `squirrel.windows/${targetArch}`);
    await this.ensureDirectory(outPath);

    const defaultExe = `${forgeConfig.packagerConfig.executableName || appName}.exe`;
    const {
      // Releasify Options
      baseUrl,
      addSearchPath,
      debugSetupExe,
      noDelta = true,
      framework,
      splashImage,
      icon,
      mainExes = [ defaultExe ],
      appIcon,
      msi,

      // Pack Options
      packId = packageJSON.name,
      packDir = dir,
      packVersion = packageJSON.version,
      packTitle = packId,
      packAuthors = packageJSON.author

    } = this.config;

    const command = 'Squirrel.exe';
    const args = ['pack'];

    // releasify args
    if (baseUrl) args.push('--baseUrl', baseUrl);
    if (addSearchPath) args.push('--addSearchPath', addSearchPath);
    if (debugSetupExe) args.push('--debugSetupExe', debugSetupExe);
    if (debugSetupExe) args.push('--debugSetupExe', debugSetupExe);
    if (noDelta) args.push('--noDelta');
    if (framework) args.push('--framework', framework);
    if (splashImage) args.push('--splashImage', splashImage);
    if (icon) args.push('--icon', icon);
    mainExes.forEach((exe) => {
      args.push('--mainExe', exe);
    });
    if (appIcon) args.push('--appIcon', appIcon);
    if (msi) args.push('--msi', msi);

    // pack args
    args.push('--packId', packId);
    args.push('--packDir', packDir);
    args.push('--packVersion', packVersion);
    args.push('--packTitle', packTitle);
    args.push('--packAuthors', packAuthors);

    const options: SpawnSyncOptionsWithStringEncoding = {
      encoding: 'utf-8',
    };
    const result = spawnSync(command, args, options);
    console.log('Squirrel.exe Pack Result', result);
    const nupkgVersion = convertVersion(packageJSON.version);
    console.log(nupkgVersion);

    // array of artifact paths to return to electron forge.
    const artifacts: string[] = [
      // test for and validate each of the files listed below to include in artifacts
      // RELEASES
      // -Setup.exe
      // -${nupkgVersion}-full.nupkg
      // -${nupkgVersion}-delta.nupkg
      // -Setup.msi
    ];
    return artifacts;
  }
}
