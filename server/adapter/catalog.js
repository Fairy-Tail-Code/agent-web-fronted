export const agentCatalog = [
  {
    id: 'data_agent',
    kind: 'agent',
    name: 'Data Studio',
    subtitle: '数据读取、预处理与分析',
    description: '面向表格与数据文件的分析工作台，适合做探索、清洗和基础建模。',
    accent: '#1f7a8c',
    promptHint: '描述你的数据目标，或先说明你希望得到的分析结果。',
    capabilities: ['数据分析', '清洗建议', '统计说明'],
  },
  {
    id: 'docx_use_agent',
    kind: 'agent',
    name: 'Document Draft',
    subtitle: '单文档生成与整理',
    description: '适合直接生成、改写或扩充单份文档内容，强调快速交付。',
    accent: '#c56a2d',
    promptHint: '说明文档目标、受众、格式要求和输出文件名。',
    capabilities: ['文档起草', '内容重写', '结构化输出'],
  },
  {
    id: 'office_team',
    kind: 'team',
    name: 'Office Team',
    subtitle: '多专家协同办公',
    description: '由搜索、Word、Markdown、PDF 四类成员协作，适合复杂办公任务。',
    accent: '#5d6d7e',
    promptHint: '描述任务目标、期望文件格式以及是否需要多步协同处理。',
    capabilities: ['团队协作', '资料汇总', '多格式产出'],
  },
];

export function getCatalogItem(agentId) {
  return agentCatalog.find(item => item.id === agentId) || agentCatalog[0];
}
