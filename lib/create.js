const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const degit = require('degit');
const ora = require('ora');
const chalk = require('chalk');
const execa = require('execa');
const Handlebars = require('handlebars');

// 模板仓库地址，这里可以换成你自己的Git模板仓库
const TEMPLATE_REPO = {
    'vue-demo': 'https://github.com/liuxj009/cli-x.git', // 用vite官方vue模板示例
    'react-demo': 'https://github.com/liuxj009/cli-x.git' // 用vite官方react模板示例
};

module.exports = async function create(projectName) {
    // 1. 校验目标目录是否已存在
    const targetDir = path.resolve(process.cwd(), projectName);
    if (fs.existsSync(targetDir)) {
        const { action } = await inquirer.prompt([
            {
                name: 'action',
                type: 'list',
                message: `目录 ${projectName} 已存在，请选择操作：`,
                choices: [
                    { name: '覆盖已有目录', value: 'overwrite' },
                    { name: '取消创建', value: 'cancel' }
                ]
            }
        ]);
        if (action === 'cancel') {
            console.log(chalk.yellow('已取消项目创建'));
            return;
        }
        // 清空已有目录
        await fs.remove(targetDir);
    }

    // 2. 交互询问用户配置
    const answers = await inquirer.prompt([
        {
            name: 'template',
            type: 'list',
            message: '请选择项目模板：',
            choices: [
                { name: 'Vue3 基础Demo', value: 'vue-demo' },
                { name: 'React 基础Demo', value: 'react-demo' }
            ]
        },
        {
            name: 'needTs',
            type: 'confirm',
            message: '是否使用TypeScript？',
            default: false
        },
        {
            name: 'needEslint',
            type: 'confirm',
            message: '是否集成ESLint？',
            default: true
        },
        {
            name: 'installDeps',
            type: 'confirm',
            message: '创建完成后是否自动安装依赖？',
            default: true
        }
    ]);

    // 3. 拉取模板
    const spinner = ora('正在拉取项目模板...').start();
    try {
        // 从Git仓库拉取模板到临时目录
        const emitter = degit(TEMPLATE_REPO[answers.template], { cache: false });
        await emitter.clone(targetDir);
        spinner.succeed('模板拉取成功');
    } catch (err) {
        spinner.fail('模板拉取失败，请检查网络连接');
        console.error(err.message);
        return;
    }

    // 4. 模板变量替换
    spinner.start('正在渲染项目配置...');
    try {
        // 读取模板中的package.json，替换项目名等变量
        const pkgPath = path.join(targetDir, 'package.json');
        const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
        const template = Handlebars.compile(pkgContent);
        const renderedPkg = template({
            projectName,
            needEslint: answers.needEslint
        });
        fs.writeFileSync(pkgPath, renderedPkg);

        // 按需删除/添加文件示例：如果用户没选TS，删除tsconfig.json
        if (!answers.needTs) {
            await fs.remove(path.join(targetDir, 'tsconfig.json'));
        }
        spinner.succeed('项目配置渲染完成');
    } catch (err) {
        spinner.warn('配置渲染出现警告，将使用默认模板配置');
    }

    // 5. 自动安装依赖
    if (answers.installDeps) {
        spinner.start('正在安装项目依赖，可能需要几分钟...');
        try {
            // 自动识别npm/yarn/pnpm，这里默认用npm，可扩展检测逻辑
            await execa('npm', ['install'], { cwd: targetDir, stdio: 'inherit' });
            spinner.succeed('依赖安装完成');
        } catch (err) {
            spinner.fail('依赖安装失败，请手动执行 npm install');
        }
    }

    // 6. 输出成功提示和下一步操作
    console.log('\n' + chalk.green('🎉 项目创建成功！'));
    console.log('\n接下来你可以执行：');
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan('  npm run dev'));
    console.log('');
};
