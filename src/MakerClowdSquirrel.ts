import { spawnSync, SpawnSyncOptionsWithStringEncoding } from 'child_process';
import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import { copyFile, stat, readdir } from 'fs/promises';
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

// These are split off since they're iotuins
export interface SigningOptions {
  // Sign files via SignTool.exe using these PARAMETERS
  signParams: string;
  // Use a custom signing COMMAND. '{{file}}' will be replaced by the path of the file to sign. This will override the signParams option.
  signTemplate: string;
}

export interface ReleasifyOptions extends SigningOptions {
  // releasify options
  releaseDir?: string; // Output DIRECTORY for releasified packages
  package?: string; // {PATH} to a '.nupkg' package to releasify
  noDelta?: boolean; // Skip the generation of delta packages
  framework?: ClowdSquirrelFramework; // net6,vcredist143-x86`  # Install .NET 6.0 (x64) and vcredist143 (x86) during setup, if not installed
  splashImage?: string; // PATH to image/gif displayed during installation
  icon?: string; //  PATH to .ico for Setup.exe and Update.exe
  appIcon?: string; // PATH to .ico for 'Apps and Features' list
  msi?: ClowdSquirrelMSI; // Compile a .msi machine-wide deployment tool with the specified {BITNESS}. (either 'x86' or 'x64')
}

export interface PackOptions extends Omit<ReleasifyOptions, 'package'> {
  // pack options
  packId?: string; // Application / package name
  packVersion?: string; // Current VERSION for release
  packDir?: string; // DIRECTORY containing application files for release
  packTitle?: string; // Optional display/friendly NAME for release
  packAuthors?: string; // Optional company or list of release AUTHORS
  includePdb?: boolean; // Add *.pdb files to release package
  releaseNotes?: string; // {PATH} to file with markdown notes for version
}

export interface PackageJSON extends Partial<{}> {
  name: string;
  version: string;
  author: string;
}

export interface MakerClowdSquirrelConfig extends PackOptions {
  debug?: boolean;
}

export default class MakerClowdSquirrel extends MakerBase<MakerClowdSquirrelConfig> {
  name = 'Clowd.Squirrel';

  defaultPlatforms: ForgePlatform[] = ['win32'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'win32';
  }

  getOutPath(makerOptions: MakerOptions): string {
    return path.resolve(
      makerOptions.makeDir,
      `clowd.squirrel.windows/${makerOptions.targetArch}`
    );
  }

  async ensureOutputPath(makerOptions: MakerOptions): Promise<string> {
    const outPath = this.getOutPath(makerOptions);
    await this.ensureDirectory(outPath);
    return outPath;
  }

  // async ensureUpdateExe(makerOptions: MakerOptions): Promise<void> {
  //   // copy Update.exe to dir
  //   // Clowd.Squirrel required Update.exe to be present in the packDir. So we copy this there.
  //   // TODO: talk to @caesay about whether this would be a good feature for Clowd.Squirrel
  //   const updateExePath = path.resolve(
  //     __dirname,
  //     '..',
  //     'vendors',
  //     'SquirrelTools',
  //     'Update.exe'
  //   );
  //   const updateExeDest = path.resolve(makerOptions.dir, 'Update.exe');
  //   await copyFile(updateExePath, updateExeDest);
  // }

  async findArtifacts(makerOptions: MakerOptions): Promise<string[]> {
    const releaseDir = await this.ensureOutputPath(makerOptions);
    const files = await readdir(releaseDir);
    const artifacts = [];
    for (const file of files) {
      const filePath = path.resolve(releaseDir, file);
      const fileStat = await stat(filePath);
      // ignore directories
      if (fileStat.isFile() && file.match(/\.nupkg$|\.exe$|\.msi$|^RELEASES$/))
        artifacts.push(filePath);
    }
    !!this.config.debug && console.log('Clowd.Squirrel Artifacts', artifacts);
    return artifacts;
  }

  async squirrelPack(makerOptions: MakerOptions): Promise<void> {
    const releaseDir = await this.ensureOutputPath(makerOptions);

    const {
      // Pack Options, in order of cli help
      // with forge specicifi defaults.
      packId = makerOptions.packageJSON.name,
      packVersion = convertVersion(makerOptions.packageJSON.version),
      packDir = makerOptions.dir,
      packTitle = packId,
      packAuthors = makerOptions.packageJSON.author,
      includePdb = false,
      releaseNotes = undefined,
      signParams = undefined,
      signTemplate = undefined,
      framework = undefined,
      noDelta = true,
      splashImage = undefined,
      icon = undefined,
      appIcon = undefined,
      msi = undefined,
    } = this.config;

    const command = 'Squirrel.exe';
    // pack args
    const args = ['pack'];
    args.push('--releaseDir', releaseDir);
    args.push('--packId', packId);
    args.push('--packVersion', packVersion);
    args.push('--packDir', packDir);
    args.push('--packTitle', packTitle);
    args.push('--packAuthors', packAuthors);
    includePdb && args.push('--includePdb');
    !!releaseNotes && args.push('--releaseNotes', releaseNotes);
    !!signParams && args.push('--signParams', signParams);
    !!signTemplate && args.push('--signTemplate', signTemplate);
    !!noDelta && args.push('--noDelta');
    !!framework && args.push('--framework', framework);
    !!splashImage && args.push('--splashImage', splashImage);
    !!icon && args.push('--icon', icon);
    !!appIcon && args.push('--appIcon', appIcon);
    !!msi && args.push('--msi', msi);

    const options: SpawnSyncOptionsWithStringEncoding = {
      encoding: 'utf-8',
    };
    !!this.config.debug && console.log('Squirrel.exe Pack Command', command, args, options);
    const result = spawnSync(command, args, options);
    !!this.config.debug && console.log('Squirrel.exe Pack Result', result);
  }

  async make(makeOpts: MakerOptions): Promise<string[]> {
    !!this.config.debug && console.log('Clowd.Squirrel Maker Options', makeOpts);
    // ensureUpdateExe doesn't seem to be necessary since I rolled back to SquirrelTools 2.9.42 from 2.9.48
    // The update.exe bundled with 2.9.48 seems to be broken...
    // await this.ensureUpdateExe(makeOpts);
    await this.squirrelPack(makeOpts);
    return this.findArtifacts(makeOpts);
  }
}
