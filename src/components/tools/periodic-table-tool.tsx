'use client';

import { useState, useMemo } from 'react';
import { Search, X, Atom } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isFullscreen?: boolean;
}

interface Element {
  number: number;
  symbol: string;
  name: string;
  nameCn: string;
  mass: number;
  category: string;
  group: number | null;
  period: number;
  electronConfig: string;
  uses: string;
}

type CategoryKey =
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'transition-metal'
  | 'post-transition'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide';

const CATEGORIES: Record<CategoryKey, { name: string; color: string; bg: string; border: string }> = {
  'alkali-metal': { name: '碱金属', color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  'alkaline-earth': { name: '碱土金属', color: '#F97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  'transition-metal': { name: '过渡金属', color: '#3B82F6', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  'post-transition': { name: '后过渡金属', color: '#06B6D4', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  'metalloid': { name: '类金属', color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  'nonmetal': { name: '非金属', color: '#8B5CF6', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  'halogen': { name: '卤素', color: '#EC4899', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  'noble-gas': { name: '稀有气体', color: '#EF4444', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  'lanthanide': { name: '镧系', color: '#A855F7', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
  'actinide': { name: '锕系', color: '#F43F5E', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
};

// 118 elements data
const ELEMENTS: Element[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', nameCn: '氢', mass: 1.008, category: 'nonmetal', group: 1, period: 1, electronConfig: '1s¹', uses: '火箭燃料、合成氨、燃料电池的清洁能源。' },
  { number: 2, symbol: 'He', name: 'Helium', nameCn: '氦', mass: 4.003, category: 'noble-gas', group: 18, period: 1, electronConfig: '1s²', uses: '飞艇气球填充、低温研究、焊接保护气。' },
  { number: 3, symbol: 'Li', name: 'Lithium', nameCn: '锂', mass: 6.941, category: 'alkali-metal', group: 1, period: 2, electronConfig: '[He] 2s¹', uses: '锂电池原料、冶金工业、心理治疗药物。' },
  { number: 4, symbol: 'Be', name: 'Beryllium', nameCn: '铍', mass: 9.012, category: 'alkaline-earth', group: 2, period: 2, electronConfig: '[He] 2s²', uses: '航空航天合金、核反应堆中子减速剂。' },
  { number: 5, symbol: 'B', name: 'Boron', nameCn: '硼', mass: 10.81, category: 'metalloid', group: 13, period: 2, electronConfig: '[He] 2s²2p¹', uses: '玻璃制造、农业硼肥、超硬材料。' },
  { number: 6, symbol: 'C', name: 'Carbon', nameCn: '碳', mass: 12.01, category: 'nonmetal', group: 14, period: 2, electronConfig: '[He] 2s²2p²', uses: '生命基础元素、钢铁冶炼、化石燃料。' },
  { number: 7, symbol: 'N', name: 'Nitrogen', nameCn: '氮', mass: 14.01, category: 'nonmetal', group: 15, period: 2, electronConfig: '[He] 2s²2p³', uses: '氮肥、液氮冷冻、氨气合成原料。' },
  { number: 8, symbol: 'O', name: 'Oxygen', nameCn: '氧', mass: 16.00, category: 'nonmetal', group: 16, period: 2, electronConfig: '[He] 2s²2p⁴', uses: '呼吸助燃、钢铁冶炼、医疗供氧。' },
  { number: 9, symbol: 'F', name: 'Fluorine', nameCn: '氟', mass: 19.00, category: 'halogen', group: 17, period: 2, electronConfig: '[He] 2s²2p⁵', uses: '牙膏含氟化物、特氟龙涂层、制冷剂。' },
  { number: 10, symbol: 'Ne', name: 'Neon', nameCn: '氖', mass: 20.18, category: 'noble-gas', group: 18, period: 2, electronConfig: '[He] 2s²2p⁶', uses: '霓虹灯、广告灯、高压指示灯。' },
  { number: 11, symbol: 'Na', name: 'Sodium', nameCn: '钠', mass: 22.99, category: 'alkali-metal', group: 1, period: 3, electronConfig: '[Ne] 3s¹', uses: '食盐成分、肥皂制造、冶金还原剂。' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', nameCn: '镁', mass: 24.31, category: 'alkaline-earth', group: 2, period: 3, electronConfig: '[Ne] 3s²', uses: '轻质合金、烟花照明弹、人体必需元素。' },
  { number: 13, symbol: 'Al', name: 'Aluminum', nameCn: '铝', mass: 26.98, category: 'post-transition', group: 13, period: 3, electronConfig: '[Ne] 3s²3p¹', uses: '铝合金制品、建筑材料、食品包装。' },
  { number: 14, symbol: 'Si', name: 'Silicon', nameCn: '硅', mass: 28.09, category: 'metalloid', group: 14, period: 3, electronConfig: '[Ne] 3s²3p²', uses: '芯片半导体、太阳能电池、玻璃陶瓷。' },
  { number: 15, symbol: 'P', name: 'Phosphorus', nameCn: '磷', mass: 30.97, category: 'nonmetal', group: 15, period: 3, electronConfig: '[Ne] 3s²3p³', uses: '磷肥、火柴原料、DNA组成成分。' },
  { number: 16, symbol: 'S', name: 'Sulfur', nameCn: '硫', mass: 32.07, category: 'nonmetal', group: 16, period: 3, electronConfig: '[Ne] 3s²3p⁴', uses: '硫酸制造、橡胶硫化、火药原料。' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', nameCn: '氯', mass: 35.45, category: 'halogen', group: 17, period: 3, electronConfig: '[Ne] 3s²3p⁵', uses: '自来水消毒、漂白粉、PVC塑料。' },
  { number: 18, symbol: 'Ar', name: 'Argon', nameCn: '氩', mass: 39.95, category: 'noble-gas', group: 18, period: 3, electronConfig: '[Ne] 3s²3p⁶', uses: '焊接保护气、白炽灯填充、惰性气氛。' },
  { number: 19, symbol: 'K', name: 'Potassium', nameCn: '钾', mass: 39.10, category: 'alkali-metal', group: 1, period: 4, electronConfig: '[Ar] 4s¹', uses: '钾肥、人体必需元素、火药原料。' },
  { number: 20, symbol: 'Ca', name: 'Calcium', nameCn: '钙', mass: 40.08, category: 'alkaline-earth', group: 2, period: 4, electronConfig: '[Ar] 4s²', uses: '骨骼牙齿成分、建筑材料、补钙剂。' },
  { number: 21, symbol: 'Sc', name: 'Scandium', nameCn: '钪', mass: 44.96, category: 'transition-metal', group: 3, period: 4, electronConfig: '[Ar] 3d¹4s²', uses: '航空合金、棒球棒、高强度灯具。' },
  { number: 22, symbol: 'Ti', name: 'Titanium', nameCn: '钛', mass: 47.87, category: 'transition-metal', group: 4, period: 4, electronConfig: '[Ar] 3d²4s²', uses: '钛合金航空、人工关节、颜料钛白。' },
  { number: 23, symbol: 'V', name: 'Vanadium', nameCn: '钒', mass: 50.94, category: 'transition-metal', group: 5, period: 4, electronConfig: '[Ar] 3d³4s²', uses: '钢铁添加剂、钒电池、催化剂。' },
  { number: 24, symbol: 'Cr', name: 'Chromium', nameCn: '铬', mass: 52.00, category: 'transition-metal', group: 6, period: 4, electronConfig: '[Ar] 3d⁵4s¹', uses: '不锈钢成分、镀铬装饰、颜料。' },
  { number: 25, symbol: 'Mn', name: 'Manganese', nameCn: '锰', mass: 54.94, category: 'transition-metal', group: 7, period: 4, electronConfig: '[Ar] 3d⁵4s²', uses: '钢铁添加剂、干电池、高锰酸钾。' },
  { number: 26, symbol: 'Fe', name: 'Iron', nameCn: '铁', mass: 55.85, category: 'transition-metal', group: 8, period: 4, electronConfig: '[Ar] 3d⁶4s²', uses: '钢铁工业、人体血红蛋白、磁铁原料。' },
  { number: 27, symbol: 'Co', name: 'Cobalt', nameCn: '钴', mass: 58.93, category: 'transition-metal', group: 9, period: 4, electronConfig: '[Ar] 3d⁷4s²', uses: '钴蓝颜料、锂电池正极、超硬合金。' },
  { number: 28, symbol: 'Ni', name: 'Nickel', nameCn: '镍', mass: 58.69, category: 'transition-metal', group: 10, period: 4, electronConfig: '[Ar] 3d⁸4s²', uses: '不锈钢、镍氢电池、电镀、催化剂。' },
  { number: 29, symbol: 'Cu', name: 'Copper', nameCn: '铜', mass: 63.55, category: 'transition-metal', group: 11, period: 4, electronConfig: '[Ar] 3d¹⁰4s¹', uses: '电线电缆、铜币、青铜器、合金。' },
  { number: 30, symbol: 'Zn', name: 'Zinc', nameCn: '锌', mass: 65.38, category: 'transition-metal', group: 12, period: 4, electronConfig: '[Ar] 3d¹⁰4s²', uses: '镀锌防腐、黄铜、人体必需微量元素。' },
  { number: 31, symbol: 'Ga', name: 'Gallium', nameCn: '镓', mass: 69.72, category: 'post-transition', group: 13, period: 4, electronConfig: '[Ar] 3d¹⁰4s²4p¹', uses: '半导体LED、砷化镓、低熔点合金。' },
  { number: 32, symbol: 'Ge', name: 'Germanium', nameCn: '锗', mass: 72.63, category: 'metalloid', group: 14, period: 4, electronConfig: '[Ar] 3d¹⁰4s²4p²', uses: '半导体材料、光纤、红外光学。' },
  { number: 33, symbol: 'As', name: 'Arsenic', nameCn: '砷', mass: 74.92, category: 'metalloid', group: 15, period: 4, electronConfig: '[Ar] 3d¹⁰4s²4p³', uses: '半导体掺杂、农药、木材防腐。' },
  { number: 34, symbol: 'Se', name: 'Selenium', nameCn: '硒', mass: 78.97, category: 'nonmetal', group: 16, period: 4, electronConfig: '[Ar] 3d¹⁰4s²4p⁴', uses: '光电池、玻璃着色、人体微量元素。' },
  { number: 35, symbol: 'Br', name: 'Bromine', nameCn: '溴', mass: 79.90, category: 'halogen', group: 17, period: 4, electronConfig: '[Ar] 3d¹⁰4s²4p⁵', uses: '阻燃剂、医药、照相胶片。' },
  { number: 36, symbol: 'Kr', name: 'Krypton', nameCn: '氪', mass: 83.80, category: 'noble-gas', group: 18, period: 4, electronConfig: '[Ar] 3d¹⁰4s²4p⁶', uses: '高性能灯泡、闪光灯、激光技术。' },
  { number: 37, symbol: 'Rb', name: 'Rubidium', nameCn: '铷', mass: 85.47, category: 'alkali-metal', group: 1, period: 5, electronConfig: '[Kr] 5s¹', uses: '原子钟、光电管、特种玻璃。' },
  { number: 38, symbol: 'Sr', name: 'Strontium', nameCn: '锶', mass: 87.62, category: 'alkaline-earth', group: 2, period: 5, electronConfig: '[Kr] 5s²', uses: '红色烟火、电视显像管、铁氧体材料。' },
  { number: 39, symbol: 'Y', name: 'Yttrium', nameCn: '钇', mass: 88.91, category: 'transition-metal', group: 3, period: 5, electronConfig: '[Kr] 4d¹5s²', uses: '钇铝石榴石激光、超导材料、合金添加剂。' },
  { number: 40, symbol: 'Zr', name: 'Zirconium', nameCn: '锆', mass: 91.22, category: 'transition-metal', group: 4, period: 5, electronConfig: '[Kr] 4d²5s²', uses: '核反应堆包壳、人造宝石、陶瓷材料。' },
  { number: 41, symbol: 'Nb', name: 'Niobium', nameCn: '铌', mass: 92.91, category: 'transition-metal', group: 5, period: 5, electronConfig: '[Kr] 4d⁴5s¹', uses: '超导合金、钢铁添加剂、电容器。' },
  { number: 42, symbol: 'Mo', name: 'Molybdenum', nameCn: '钼', mass: 95.95, category: 'transition-metal', group: 6, period: 5, electronConfig: '[Kr] 4d⁵5s¹', uses: '高强度钢、润滑油添加剂、催化剂。' },
  { number: 43, symbol: 'Tc', name: 'Technetium', nameCn: '锝', mass: 98, category: 'transition-metal', group: 7, period: 5, electronConfig: '[Kr] 4d⁵5s²', uses: '人工合成元素、医学影像造影剂。' },
  { number: 44, symbol: 'Ru', name: 'Ruthenium', nameCn: '钌', mass: 101.1, category: 'transition-metal', group: 8, period: 5, electronConfig: '[Kr] 4d⁷5s¹', uses: '铂合金硬化剂、电子工业、催化剂。' },
  { number: 45, symbol: 'Rh', name: 'Rhodium', nameCn: '铑', mass: 102.9, category: 'transition-metal', group: 9, period: 5, electronConfig: '[Kr] 4d⁸5s¹', uses: '汽车三元催化、首饰电镀、热电偶。' },
  { number: 46, symbol: 'Pd', name: 'Palladium', nameCn: '钯', mass: 106.4, category: 'transition-metal', group: 10, period: 5, electronConfig: '[Kr] 4d¹⁰', uses: '汽车催化器、电子元件、牙科材料。' },
  { number: 47, symbol: 'Ag', name: 'Silver', nameCn: '银', mass: 107.9, category: 'transition-metal', group: 11, period: 5, electronConfig: '[Kr] 4d¹⁰5s¹', uses: '首饰货币、银镜反应、导电触点。' },
  { number: 48, symbol: 'Cd', name: 'Cadmium', nameCn: '镉', mass: 112.4, category: 'transition-metal', group: 12, period: 5, electronConfig: '[Kr] 4d¹⁰5s²', uses: '镍镉电池、颜料、电镀防腐蚀。' },
  { number: 49, symbol: 'In', name: 'Indium', nameCn: '铟', mass: 114.8, category: 'post-transition', group: 13, period: 5, electronConfig: '[Kr] 4d¹⁰5s²5p¹', uses: 'ITO透明导电膜、低熔点合金、轴承。' },
  { number: 50, symbol: 'Sn', name: 'Tin', nameCn: '锡', mass: 118.7, category: 'post-transition', group: 14, period: 5, electronConfig: '[Kr] 4d¹⁰5s²5p²', uses: '焊锡、马口铁、青铜合金、镀锡板。' },
  { number: 51, symbol: 'Sb', name: 'Antimony', nameCn: '锑', mass: 121.8, category: 'metalloid', group: 15, period: 5, electronConfig: '[Kr] 4d¹⁰5s²5p³', uses: '阻燃剂、铅酸电池、半导体材料。' },
  { number: 52, symbol: 'Te', name: 'Tellurium', nameCn: '碲', mass: 127.6, category: 'metalloid', group: 16, period: 5, electronConfig: '[Kr] 4d¹⁰5s²5p⁴', uses: '太阳能电池、合金添加剂、橡胶硫化。' },
  { number: 53, symbol: 'I', name: 'Iodine', nameCn: '碘', mass: 126.9, category: 'halogen', group: 17, period: 5, electronConfig: '[Kr] 4d¹⁰5s²5p⁵', uses: '碘酒消毒、食盐加碘、甲状腺素原料。' },
  { number: 54, symbol: 'Xe', name: 'Xenon', nameCn: '氙', mass: 131.3, category: 'noble-gas', group: 18, period: 5, electronConfig: '[Kr] 4d¹⁰5s²5p⁶', uses: '氙气灯、麻醉剂、高速摄影闪光灯。' },
  { number: 55, symbol: 'Cs', name: 'Cesium', nameCn: '铯', mass: 132.9, category: 'alkali-metal', group: 1, period: 6, electronConfig: '[Xe] 6s¹', uses: '原子钟标准、光电管、钻井液。' },
  { number: 56, symbol: 'Ba', name: 'Barium', nameCn: '钡', mass: 137.3, category: 'alkaline-earth', group: 2, period: 6, electronConfig: '[Xe] 6s²', uses: '钡餐造影、绿色烟火、钡铁氧体磁铁。' },
  { number: 57, symbol: 'La', name: 'Lanthanum', nameCn: '镧', mass: 138.9, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 5d¹6s²', uses: '镍氢电池、光学玻璃、催化剂。' },
  { number: 58, symbol: 'Ce', name: 'Cerium', nameCn: '铈', mass: 140.1, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f¹5d¹6s²', uses: '汽车催化剂、玻璃抛光粉、打火石。' },
  { number: 59, symbol: 'Pr', name: 'Praseodymium', nameCn: '镨', mass: 140.9, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f³6s²', uses: '钕磁铁、特种玻璃、陶瓷颜料。' },
  { number: 60, symbol: 'Nd', name: 'Neodymium', nameCn: '钕', mass: 144.2, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f⁴6s²', uses: '钕铁硼永磁体、激光材料、玻璃着色。' },
  { number: 61, symbol: 'Pm', name: 'Promethium', nameCn: '钷', mass: 145, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f⁵6s²', uses: '人工放射性元素、夜光涂料、核电池。' },
  { number: 62, symbol: 'Sm', name: 'Samarium', nameCn: '钐', mass: 150.4, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f⁶6s²', uses: '钐钴磁铁、核反应堆控制棒。' },
  { number: 63, symbol: 'Eu', name: 'Europium', nameCn: '铕', mass: 152.0, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f⁷6s²', uses: '红绿荧光粉、彩色电视显像管、防伪材料。' },
  { number: 64, symbol: 'Gd', name: 'Gadolinium', nameCn: '钆', mass: 157.3, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f⁷5d¹6s²', uses: 'MRI造影剂、磁制冷、核反应堆屏蔽。' },
  { number: 65, symbol: 'Tb', name: 'Terbium', nameCn: '铽', mass: 158.9, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f⁹6s²', uses: '绿色荧光粉、磁光存储、磁致伸缩材料。' },
  { number: 66, symbol: 'Dy', name: 'Dysprosium', nameCn: '镝', mass: 162.5, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f¹⁰6s²', uses: '钕磁铁添加剂、磁光记录、核反应堆。' },
  { number: 67, symbol: 'Ho', name: 'Holmium', nameCn: '钬', mass: 164.9, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f¹¹6s²', uses: '强磁场产生、激光材料、核反应堆。' },
  { number: 68, symbol: 'Er', name: 'Erbium', nameCn: '铒', mass: 167.3, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f¹²6s²', uses: '光纤放大器、激光医疗、粉色玻璃。' },
  { number: 69, symbol: 'Tm', name: 'Thulium', nameCn: '铥', mass: 168.9, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f¹³6s²', uses: '便携式X光机、荧光材料、高温超导。' },
  { number: 70, symbol: 'Yb', name: 'Ytterbium', nameCn: '镱', mass: 173.0, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f¹⁴6s²', uses: '光纤激光器、原子钟、应力计。' },
  { number: 71, symbol: 'Lu', name: 'Lutetium', nameCn: '镥', mass: 175.0, category: 'lanthanide', group: null, period: 6, electronConfig: '[Xe] 4f¹⁴5d¹6s²', uses: '石油裂化催化剂、PET扫描探测器。' },
  { number: 72, symbol: 'Hf', name: 'Hafnium', nameCn: '铪', mass: 178.5, category: 'transition-metal', group: 4, period: 6, electronConfig: '[Xe] 4f¹⁴5d²6s²', uses: '核反应堆控制棒、半导体制造。' },
  { number: 73, symbol: 'Ta', name: 'Tantalum', nameCn: '钽', mass: 180.9, category: 'transition-metal', group: 5, period: 6, electronConfig: '[Xe] 4f¹⁴5d³6s²', uses: '钽电容器、外科手术器材、化工设备。' },
  { number: 74, symbol: 'W', name: 'Tungsten', nameCn: '钨', mass: 183.8, category: 'transition-metal', group: 6, period: 6, electronConfig: '[Xe] 4f¹⁴5d⁴6s²', uses: '灯泡灯丝、硬质合金、钨钢刀具。' },
  { number: 75, symbol: 'Re', name: 'Rhenium', nameCn: '铼', mass: 186.2, category: 'transition-metal', group: 7, period: 6, electronConfig: '[Xe] 4f¹⁴5d⁵6s²', uses: '高温合金、喷气发动机、催化剂。' },
  { number: 76, symbol: 'Os', name: 'Osmium', nameCn: '锇', mass: 190.2, category: 'transition-metal', group: 8, period: 6, electronConfig: '[Xe] 4f¹⁴5d⁶6s²', uses: '密度最大元素、合金硬化剂、电触点。' },
  { number: 77, symbol: 'Ir', name: 'Iridium', nameCn: '铱', mass: 192.2, category: 'transition-metal', group: 9, period: 6, electronConfig: '[Xe] 4f¹⁴5d⁷6s²', uses: '火花塞电极、标准千克原器、钢笔尖。' },
  { number: 78, symbol: 'Pt', name: 'Platinum', nameCn: '铂', mass: 195.1, category: 'transition-metal', group: 10, period: 6, electronConfig: '[Xe] 4f¹⁴5d⁹6s¹', uses: '首饰、汽车催化转化器、抗癌药物。' },
  { number: 79, symbol: 'Au', name: 'Gold', nameCn: '金', mass: 197.0, category: 'transition-metal', group: 11, period: 6, electronConfig: '[Xe] 4f¹⁴5d¹⁰6s¹', uses: '黄金首饰货币、电子元件、牙科材料。' },
  { number: 80, symbol: 'Hg', name: 'Mercury', nameCn: '汞', mass: 200.6, category: 'transition-metal', group: 12, period: 6, electronConfig: '[Xe] 4f¹⁴5d¹⁰6s²', uses: '温度计、日光灯、电池、氯碱工业。' },
  { number: 81, symbol: 'Tl', name: 'Thallium', nameCn: '铊', mass: 204.4, category: 'post-transition', group: 13, period: 6, electronConfig: '[Xe] 4f¹⁴5d¹⁰6s²6p¹', uses: '光电管、合金、杀鼠剂（有毒）。' },
  { number: 82, symbol: 'Pb', name: 'Lead', nameCn: '铅', mass: 207.2, category: 'post-transition', group: 14, period: 6, electronConfig: '[Xe] 4f¹⁴5d¹⁰6s²6p²', uses: '蓄电池、防辐射屏蔽、焊锡（逐渐淘汰）。' },
  { number: 83, symbol: 'Bi', name: 'Bismuth', nameCn: '铋', mass: 209.0, category: 'post-transition', group: 15, period: 6, electronConfig: '[Xe] 4f¹⁴5d¹⁰6s²6p³', uses: '低熔点合金、药品、彩色晶体。' },
  { number: 84, symbol: 'Po', name: 'Polonium', nameCn: '钋', mass: 209, category: 'metalloid', group: 16, period: 6, electronConfig: '[Xe] 4f¹⁴5d¹⁰6s²6p⁴', uses: '放射性元素、静电消除器、核电池。' },
  { number: 85, symbol: 'At', name: 'Astatine', nameCn: '砹', mass: 210, category: 'halogen', group: 17, period: 6, electronConfig: '[Xe] 4f¹⁴5d¹⁰6s²6p⁵', uses: '放射性卤素、医学放射治疗研究。' },
  { number: 86, symbol: 'Rn', name: 'Radon', nameCn: '氡', mass: 222, category: 'noble-gas', group: 18, period: 6, electronConfig: '[Xe] 4f¹⁴5d¹⁰6s²6p⁶', uses: '放射性气体、癌症放射治疗、地震预报。' },
  { number: 87, symbol: 'Fr', name: 'Francium', nameCn: '钫', mass: 223, category: 'alkali-metal', group: 1, period: 7, electronConfig: '[Rn] 7s¹', uses: '放射性元素、研究用、自然界极微量。' },
  { number: 88, symbol: 'Ra', name: 'Radium', nameCn: '镭', mass: 226, category: 'alkaline-earth', group: 2, period: 7, electronConfig: '[Rn] 7s²', uses: '放射性元素、历史上用于发光涂料、癌症治疗。' },
  { number: 89, symbol: 'Ac', name: 'Actinium', nameCn: '锕', mass: 227, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 6d¹7s²', uses: '放射性元素、中子源、医疗用同位素。' },
  { number: 90, symbol: 'Th', name: 'Thorium', nameCn: '钍', mass: 232.0, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 6d²7s²', uses: '钍基核燃料、气灯纱罩、合金。' },
  { number: 91, symbol: 'Pa', name: 'Protactinium', nameCn: '镤', mass: 231.0, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f²6d¹7s²', uses: '放射性元素、核研究、铀衰变中间产物。' },
  { number: 92, symbol: 'U', name: 'Uranium', nameCn: '铀', mass: 238.0, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f³6d¹7s²', uses: '核反应堆燃料、核武器、玻璃着色。' },
  { number: 93, symbol: 'Np', name: 'Neptunium', nameCn: '镎', mass: 237, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f⁴6d¹7s²', uses: '人工合成超铀元素、中子探测器。' },
  { number: 94, symbol: 'Pu', name: 'Plutonium', nameCn: '钚', mass: 244, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f⁶7s²', uses: '核武器、核反应堆燃料、太空电池。' },
  { number: 95, symbol: 'Am', name: 'Americium', nameCn: '镅', mass: 243, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f⁷7s²', uses: '烟雾报警器、工业测厚仪。' },
  { number: 96, symbol: 'Cm', name: 'Curium', nameCn: '锔', mass: 247, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f⁷6d¹7s²', uses: '人造元素、α粒子源、太空能源。' },
  { number: 97, symbol: 'Bk', name: 'Berkelium', nameCn: '锫', mass: 247, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f⁹7s²', uses: '人造元素、科研用途。' },
  { number: 98, symbol: 'Cf', name: 'Californium', nameCn: '锎', mass: 251, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f¹⁰7s²', uses: '强中子源、癌症治疗、探矿。' },
  { number: 99, symbol: 'Es', name: 'Einsteinium', nameCn: '锿', mass: 252, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f¹¹7s²', uses: '人造元素、科学研究。' },
  { number: 100, symbol: 'Fm', name: 'Fermium', nameCn: '镄', mass: 257, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f¹²7s²', uses: '人造放射性元素、科研。' },
  { number: 101, symbol: 'Md', name: 'Mendelevium', nameCn: '钔', mass: 258, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f¹³7s²', uses: '人造元素、纪念门捷列夫。' },
  { number: 102, symbol: 'No', name: 'Nobelium', nameCn: '锘', mass: 259, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f¹⁴7s²', uses: '人造元素、纪念诺贝尔。' },
  { number: 103, symbol: 'Lr', name: 'Lawrencium', nameCn: '铹', mass: 266, category: 'actinide', group: null, period: 7, electronConfig: '[Rn] 5f¹⁴7s²7p¹', uses: '人造元素、锕系最后一个元素。' },
  { number: 104, symbol: 'Rf', name: 'Rutherfordium', nameCn: '𬬻', mass: 267, category: 'transition-metal', group: 4, period: 7, electronConfig: '[Rn] 5f¹⁴6d²7s²', uses: '人造超重元素、科研。' },
  { number: 105, symbol: 'Db', name: 'Dubnium', nameCn: '𬭊', mass: 268, category: 'transition-metal', group: 5, period: 7, electronConfig: '[Rn] 5f¹⁴6d³7s²', uses: '人造超重元素、科研。' },
  { number: 106, symbol: 'Sg', name: 'Seaborgium', nameCn: '𬭳', mass: 269, category: 'transition-metal', group: 6, period: 7, electronConfig: '[Rn] 5f¹⁴6d⁴7s²', uses: '人造超重元素、科研。' },
  { number: 107, symbol: 'Bh', name: 'Bohrium', nameCn: '𬭛', mass: 270, category: 'transition-metal', group: 7, period: 7, electronConfig: '[Rn] 5f¹⁴6d⁵7s²', uses: '人造超重元素、科研。' },
  { number: 108, symbol: 'Hs', name: 'Hassium', nameCn: '𬭶', mass: 269, category: 'transition-metal', group: 8, period: 7, electronConfig: '[Rn] 5f¹⁴6d⁶7s²', uses: '人造超重元素、科研。' },
  { number: 109, symbol: 'Mt', name: 'Meitnerium', nameCn: '鿏', mass: 278, category: 'transition-metal', group: 9, period: 7, electronConfig: '[Rn] 5f¹⁴6d⁷7s²', uses: '人造超重元素、科研。' },
  { number: 110, symbol: 'Ds', name: 'Darmstadtium', nameCn: '𫟼', mass: 281, category: 'transition-metal', group: 10, period: 7, electronConfig: '[Rn] 5f¹⁴6d⁸7s²', uses: '人造超重元素、科研。' },
  { number: 111, symbol: 'Rg', name: 'Roentgenium', nameCn: '𬬭', mass: 282, category: 'transition-metal', group: 11, period: 7, electronConfig: '[Rn] 5f¹⁴6d⁹7s²', uses: '人造超重元素、科研。' },
  { number: 112, symbol: 'Cn', name: 'Copernicium', nameCn: '鿔', mass: 285, category: 'transition-metal', group: 12, period: 7, electronConfig: '[Rn] 5f¹⁴6d¹⁰7s²', uses: '人造超重元素、科研。' },
  { number: 113, symbol: 'Nh', name: 'Nihonium', nameCn: '鿭', mass: 286, category: 'post-transition', group: 13, period: 7, electronConfig: '[Rn] 5f¹⁴6d¹⁰7s²7p¹', uses: '日本发现的人造元素、科研。' },
  { number: 114, symbol: 'Fl', name: 'Flerovium', nameCn: '𫓧', mass: 289, category: 'post-transition', group: 14, period: 7, electronConfig: '[Rn] 5f¹⁴6d¹⁰7s²7p²', uses: '人造超重元素、科研。' },
  { number: 115, symbol: 'Mc', name: 'Moscovium', nameCn: '镆', mass: 290, category: 'post-transition', group: 15, period: 7, electronConfig: '[Rn] 5f¹⁴6d¹⁰7s²7p³', uses: '人造超重元素、科研。' },
  { number: 116, symbol: 'Lv', name: 'Livermorium', nameCn: '𫟷', mass: 293, category: 'post-transition', group: 16, period: 7, electronConfig: '[Rn] 5f¹⁴6d¹⁰7s²7p⁴', uses: '人造超重元素、科研。' },
  { number: 117, symbol: 'Ts', name: 'Tennessine', nameCn: '鿬', mass: 294, category: 'halogen', group: 17, period: 7, electronConfig: '[Rn] 5f¹⁴6d¹⁰7s²7p⁵', uses: '人造超重元素、科研。' },
  { number: 118, symbol: 'Og', name: 'Oganesson', nameCn: '鿫', mass: 294, category: 'noble-gas', group: 18, period: 7, electronConfig: '[Rn] 5f¹⁴6d¹⁰7s²7p⁶', uses: '人造超重元素、目前已知最重元素。' },
];

// Grid position calculator
function getElementPosition(el: Element): { row: number; col: number } {
  if (el.category === 'lanthanide') {
    return { row: 9, col: el.number - 57 + 3 };
  }
  if (el.category === 'actinide') {
    return { row: 10, col: el.number - 89 + 3 };
  }
  if (el.group === null) return { row: 0, col: 0 };
  return { row: el.period, col: el.group };
}

export default function PeriodicTableTool({ isFullscreen = false }: Props) {
  const [search, setSearch] = useState('');
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [highlightFlash, setHighlightFlash] = useState<string | null>(null);

  const lowerSearch = search.trim().toLowerCase();

  const matchedElements = useMemo(() => {
    if (!lowerSearch) return new Set<string>();
    return new Set(
      ELEMENTS.filter(
        (e) =>
          e.symbol.toLowerCase() === lowerSearch ||
          e.name.toLowerCase().includes(lowerSearch) ||
          e.nameCn.includes(search.trim()) ||
          e.number.toString() === search.trim()
      ).map((e) => e.symbol)
    );
  }, [search, lowerSearch]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (val.trim()) {
      // Find first match and flash it
      const match = ELEMENTS.find(
        (e) =>
          e.symbol.toLowerCase() === val.trim().toLowerCase() ||
          e.nameCn === val.trim() ||
          e.number.toString() === val.trim()
      );
      if (match) {
        setHighlightFlash(match.symbol);
        setTimeout(() => setHighlightFlash(null), 1500);
      }
    }
  };

  const isMatched = (symbol: string) => {
    if (!lowerSearch) return true;
    return matchedElements.has(symbol);
  };

  const renderElementCell = (el: Element) => {
    const cat = CATEGORIES[el.category as CategoryKey] || CATEGORIES['transition-metal'];
    const matched = isMatched(el.symbol);
    const isFlash = highlightFlash === el.symbol;

    return (
      <motion.button
        key={el.symbol}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSelectedElement(el)}
        className={`
          aspect-square rounded-lg flex flex-col items-center justify-center
          border-l-4 p-0.5 text-center transition-all
          ${cat.bg} ${cat.border}
          ${!matched ? 'opacity-20' : ''}
          ${isFlash ? 'ring-2 ring-white animate-pulse scale-110 z-10' : ''}
          hover:z-10 hover:shadow-lg
        `}
        style={{ borderLeftColor: cat.color }}
      >
        <div className="text-[10px] text-[var(--muted-foreground)] leading-tight">
          {el.number}
        </div>
        <div className="font-bold text-sm sm:text-base leading-tight" style={{ color: matched ? cat.color : 'var(--muted-foreground)' }}>
          {el.symbol}
        </div>
        <div className="text-[9px] sm:text-[10px] text-[var(--muted-foreground)] leading-tight truncate w-full px-0.5">
          {el.nameCn}
        </div>
      </motion.button>
    );
  };

  // Build grid
  const mainTable: (Element | null)[][] = [];
  for (let row = 1; row <= 7; row++) {
    mainTable[row] = [];
    for (let col = 1; col <= 18; col++) {
      mainTable[row][col] = null;
    }
  }

  ELEMENTS.forEach((el) => {
    if (el.category === 'lanthanide' || el.category === 'actinide') return;
    const pos = getElementPosition(el);
    if (pos.row >= 1 && pos.row <= 7 && pos.col >= 1 && pos.col <= 18) {
      mainTable[pos.row][pos.col] = el;
    }
  });

  const lanthanides = ELEMENTS.filter((e) => e.category === 'lanthanide');
  const actinides = ELEMENTS.filter((e) => e.category === 'actinide');

  const selCat = selectedElement
    ? CATEGORIES[selectedElement.category as CategoryKey] || CATEGORIES['transition-metal']
    : null;

  return (
    <div className={`flex flex-col ${isFullscreen ? 'h-screen' : 'min-h-[600px]'}`}>
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Atom size={20} className="text-[var(--primary)]" />
          <h2 className="text-lg font-bold">化学元素周期表</h2>
          <span className="text-xs text-[var(--muted-foreground)] ml-2">共 118 种元素</span>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="搜索元素名/符号/原子序数…"
            className="w-full pl-9 pr-8 py-2 rounded-xl text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center">
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
              <span className="text-[var(--muted-foreground)]">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-[900px] mx-auto">
          {/* Main 7x18 grid */}
          <div
            className="grid gap-1 sm:gap-1.5 mb-4"
            style={{
              gridTemplateColumns: 'repeat(18, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(7, 1fr)',
            }}
          >
            {Array.from({ length: 7 }).map((_, rowIdx) =>
              Array.from({ length: 18 }).map((_, colIdx) => {
                const el = mainTable[rowIdx + 1]?.[colIdx + 1];
                if (el) {
                  return <div key={`${rowIdx}-${colIdx}`}>{renderElementCell(el)}</div>;
                }
                // Placeholder for empty cells
                return <div key={`${rowIdx}-${colIdx}`} className="aspect-square" />;
              })
            )}
          </div>

          {/* Lanthanides + Actinides */}
          <div className="space-y-1.5 pt-2">
            <div
              className="grid gap-1 sm:gap-1.5 items-center"
              style={{
                gridTemplateColumns: 'auto repeat(15, minmax(0, 1fr))',
              }}
            >
              <div className="text-xs text-[var(--muted-foreground)] text-right pr-2 font-medium">
                镧系
              </div>
              {lanthanides.map((el) => renderElementCell(el))}
            </div>
            <div
              className="grid gap-1 sm:gap-1.5 items-center"
              style={{
                gridTemplateColumns: 'auto repeat(15, minmax(0, 1fr))',
              }}
            >
              <div className="text-xs text-[var(--muted-foreground)] text-right pr-2 font-medium">
                锕系
              </div>
              {actinides.map((el) => renderElementCell(el))}
            </div>
          </div>
        </div>
      </div>

      {/* Element Detail Modal */}
      <AnimatePresence>
        {selectedElement && selCat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedElement(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-card rounded-3xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="p-6 relative"
                style={{
                  background: `linear-gradient(135deg, ${selCat.color}30, transparent)`,
                }}
              >
                <button
                  onClick={() => setSelectedElement(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X size={20} />
                </button>
                <div className="flex items-start gap-6">
                  <div
                    className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center border-l-4"
                    style={{
                      backgroundColor: selCat.color + '20',
                      borderLeftColor: selCat.color,
                    }}
                  >
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {selectedElement.number}
                    </div>
                    <div className="text-4xl font-bold" style={{ color: selCat.color }}>
                      {selectedElement.symbol}
                    </div>
                    <div className="text-xs">{selectedElement.nameCn}</div>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-2xl font-bold mb-1">{selectedElement.nameCn}</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-2">
                      {selectedElement.name}
                    </p>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: selCat.color + '20',
                        color: selCat.color,
                      }}
                    >
                      {selCat.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--muted-foreground)] mb-1">原子序数</div>
                  <div className="font-semibold">{selectedElement.number}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--muted-foreground)] mb-1">原子量</div>
                  <div className="font-semibold">{selectedElement.mass}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--muted-foreground)] mb-1">周期</div>
                  <div className="font-semibold">第 {selectedElement.period} 周期</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--muted-foreground)] mb-1">族</div>
                  <div className="font-semibold">
                    {selectedElement.group
                      ? `第 ${selectedElement.group} 族`
                      : selCat.name}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-[var(--muted-foreground)] mb-1">电子排布</div>
                  <div className="font-mono text-sm bg-[var(--muted)] px-3 py-2 rounded-lg">
                    {selectedElement.electronConfig}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-[var(--muted-foreground)] mb-1">常见用途</div>
                  <div className="text-sm leading-relaxed">{selectedElement.uses}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
