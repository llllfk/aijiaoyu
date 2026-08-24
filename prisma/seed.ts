import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const tools = [
  { name: '随机点名器', slug: 'random-name-picker', emoji: '🎯', subject: '班级管理', description: '课堂随机抽取学生回答问题，支持不重复抽取模式', usage: '粘贴名单后点击开始抽取，支持不重复模式和全屏投屏' },
  { name: '课堂计时器', slug: 'classroom-timer', emoji: '⏱️', subject: '班级管理', description: '正计时与倒计时双模式，大圆环显示，投影清晰', usage: '选择倒计时/正计时模式，设置时间后开始，支持全屏显示' },
  { name: '函数图像绘制器', slug: 'function-plotter', emoji: '📈', subject: '数学', description: '输入函数表达式绘制图像，支持多函数对比和参数滑块', usage: '输入y=表达式，支持sin/cos/log/sqrt等函数，可缩放平移' },
  { name: '转盘抽奖', slug: 'spinner-wheel', emoji: '🎡', subject: '课堂游戏', description: '自定义选项的幸运转盘，活跃课堂气氛', usage: '添加选项后点击旋转，支持自定义颜色和音效' },
  { name: '随机分组器', slug: 'random-grouper', emoji: '👥', subject: '班级管理', description: '快速将学生随机分组，支持拖拽调整和锁定成员', usage: '输入名单，设置组数或每组人数，一键生成随机分组' },
  { name: '思维导图', slug: 'mind-map', emoji: '🧠', subject: '语文', description: '课堂快速绘制思维导图，支持节点编辑和导出', usage: '双击编辑节点，Tab添加子节点，Enter添加同级节点' },
  { name: '化学元素周期表', slug: 'periodic-table', emoji: '⚗️', subject: '化学', description: '完整118个元素周期表，点击查看元素详情', usage: '点击元素查看详情，搜索框快速定位元素' },
];

async function main() {
  console.log('开始种子数据...');

  // 清理旧数据
  await prisma.usageLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.tool.deleteMany();

  // 创建工具
  for (const tool of tools) {
    await prisma.tool.create({
      data: {
        ...tool,
        useCount: Math.floor(Math.random() * 10000) + 1000,
      },
    });
  }
  console.log('✓ 工具数据已创建');

  // 创建团队
  const team1 = await prisma.team.create({
    data: { name: '第一实验小学教研组' },
  });
  const team2 = await prisma.team.create({
    data: { name: '启明教育科技' },
  });
  console.log('✓ 团队数据已创建');

  const hashedPassword = await bcrypt.hash('admin123456', 10);
  const userPassword = await bcrypt.hash('user123456', 10);

  // 超管
  await prisma.user.create({
    data: {
      email: 'admin@platform.com',
      password: hashedPassword,
      nickname: '超级管理员',
      role: 'super_admin',
      status: 'active',
    },
  });
  console.log('✓ 超管账号已创建');

  // 团队1管理员
  const admin1 = await prisma.user.create({
    data: {
      email: 'teacher1@school.com',
      password: userPassword,
      nickname: '王老师',
      role: 'team_admin',
      teamId: team1.id,
      status: 'active',
    },
  });
  await prisma.team.update({
    where: { id: team1.id },
    data: { adminId: admin1.id },
  });

  // 团队1成员
  await prisma.user.createMany({
    data: [
      { email: 'teacher2@school.com', password: userPassword, nickname: '李老师', role: 'team_user', teamId: team1.id, status: 'active' },
      { email: 'teacher3@school.com', password: userPassword, nickname: '张老师', role: 'team_user', teamId: team1.id, status: 'active' },
      { email: 'teacher4@school.com', password: userPassword, nickname: '刘老师', role: 'team_user', teamId: team1.id, status: 'active' },
    ],
  });

  // 团队2管理员
  const admin2 = await prisma.user.create({
    data: {
      email: 'manager@qmjy.com',
      password: userPassword,
      nickname: '启明管理员',
      role: 'team_admin',
      teamId: team2.id,
      status: 'active',
    },
  });
  await prisma.team.update({
    where: { id: team2.id },
    data: { adminId: admin2.id },
  });

  // 团队2成员
  await prisma.user.createMany({
    data: [
      { email: 'user1@qmjy.com', password: userPassword, nickname: '陈老师', role: 'team_user', teamId: team2.id, status: 'active' },
      { email: 'user2@qmjy.com', password: userPassword, nickname: '周老师', role: 'team_user', teamId: team2.id, status: 'active' },
      { email: 'user3@qmjy.com', password: userPassword, nickname: '吴老师', role: 'team_user', teamId: team2.id, status: 'active' },
    ],
  });

  // 无团队用户
  await prisma.user.create({
    data: {
      email: 'free@user.com',
      password: userPassword,
      nickname: '自由用户',
      role: 'free_user',
      status: 'active',
    },
  });

  console.log('✓ 用户数据已创建');
  console.log('种子数据完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
