#!/usr/bin/env node
const { Command } = require('commander');
const pkg = require('../package.json');
const createCommand = require('../lib/create');

const program = new Command();

// 注册版本号命令 my-cli --version
program.version(pkg.version);

// 注册核心create命令：my-cli create <项目名>
program
  .command('create <projectName>')
  .description('创建一个新的前端项目')
  .action((projectName) => {
    // 调用create逻辑，把用户输入的项目名传进去
    createCommand(projectName);
  });

// 解析命令行参数
program.parse(process.argv);
