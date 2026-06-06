import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import {
  ArrowRightOutlined,
  RobotOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  CodeOutlined,
  GlobalOutlined,
  TeamOutlined,
} from '@ant-design/icons';

/* ---- Intersection Observer hook for scroll reveal ---- */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ---- Feature data ---- */
const FEATURES = [
  { icon: <RobotOutlined />, title: '智能对话', desc: '多 Agent 协同，精准理解意图，完成复杂任务', color: 'var(--accent-primary)' },
  { icon: <DatabaseOutlined />, title: '知识库', desc: '上传文档即时索引，智能语义检索', color: 'var(--accent-blue)' },
  { icon: <ThunderboltOutlined />, title: '实时流式', desc: 'AG-UI 协议驱动，零延迟响应体验', color: 'var(--accent-warm)' },
  { icon: <SafetyCertificateOutlined />, title: '安全可信', desc: '零密码登录，端到端加密，企业级防护', color: 'var(--accent-secondary)' },
  { icon: <CodeOutlined />, title: '工具调用', desc: 'Agent 自主调用工具链，自动化工作流', color: 'var(--accent-purple)' },
  { icon: <GlobalOutlined />, title: '多模型支持', desc: '灵活接入多种 LLM，适配不同场景', color: 'var(--accent-rose)' },
];

/* ---- Floating particles ---- */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[var(--accent-primary)]/[0.04] -top-40 -left-40 blur-3xl" style={{ animation: 'floatOrb 20s ease-in-out infinite' }} />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[var(--accent-warm)]/[0.05] top-1/3 -right-32 blur-3xl" style={{ animation: 'floatOrb 25s ease-in-out infinite reverse' }} />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-[var(--accent-secondary)]/[0.04] -bottom-20 left-1/4 blur-3xl" style={{ animation: 'floatOrb 22s ease-in-out infinite' }} />
    </div>
  );
}

/* ================================================================ */
export default function LandingPage() {
  const navigate = useNavigate();
  const hero = useScrollReveal();
  const features = useScrollReveal();
  const cta = useScrollReveal();

  return (
    <div className="min-h-screen overflow-x-hidden relative">
      <FloatingOrbs />

      {/* ---- Navbar ---- */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20">
            <ThunderboltOutlined className="text-white text-base" />
          </div>
          <span className="display-font text-[22px] font-semibold text-[#1a1f1a]">Agent Studio</span>
        </div>
        <Button
          type="primary"
          onClick={() => navigate('/login')}
          className="btn-ripple !rounded-xl !h-10 !px-6 !font-medium !bg-gradient-to-r !from-[var(--accent-primary)] !to-[#3d7a6f] !border-none shadow-lg shadow-[var(--accent-primary)]/20 hover:shadow-xl hover:shadow-[var(--accent-primary)]/30 transition-all"
          icon={<ArrowRightOutlined />}
          iconPosition="end"
        >
          登录
        </Button>
      </nav>

      {/* ---- Hero Section ---- */}
      <section
        ref={hero.ref}
        className={`relative z-10 px-6 md:px-12 lg:px-20 pt-16 md:pt-24 pb-20 md:pb-32 text-center transition-all duration-700 ${hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-[720px] mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-primary)]/8 border border-[var(--accent-primary)]/15 px-4 py-1.5 mb-8">
            <TeamOutlined className="text-[var(--accent-primary)] text-sm" />
            <span className="text-[13px] font-medium text-[var(--accent-primary)]">多智能体协作平台</span>
          </div>

          {/* Title */}
          <h1 className="display-font text-[40px] md:text-[56px] lg:text-[64px] font-bold text-[#1a1f1a] leading-[1.1] mb-6 tracking-tight">
            让 AI Agent
            <br />
            <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
              为你工作
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[17px] md:text-[19px] text-[var(--ink-secondary)] leading-relaxed max-w-[520px] mx-auto mb-10">
            集成多智能体协作、知识库检索与工具调用，一站式完成复杂业务任务
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-4">
            <Button
              size="large"
              type="primary"
              onClick={() => navigate('/login')}
              className="btn-ripple !rounded-2xl !h-13 !px-10 !text-[16px] !font-semibold !bg-gradient-to-r !from-[var(--accent-primary)] !to-[#3d7a6f] !border-none shadow-xl shadow-[var(--accent-primary)]/25 hover:shadow-2xl hover:shadow-[var(--accent-primary)]/35 hover:!scale-[1.03] transition-all duration-300"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
            >
              开始使用
            </Button>
          </div>
        </div>

        {/* Decorative floating shapes */}
        <div className="hidden lg:block absolute top-20 left-[8%] w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/6 border border-[var(--accent-primary)]/10 rotate-12" style={{ animation: 'floatShape 6s ease-in-out infinite' }} />
        <div className="hidden lg:block absolute bottom-16 right-[10%] w-12 h-12 rounded-full bg-[var(--accent-warm)]/8 border border-[var(--accent-warm)]/12" style={{ animation: 'floatShape 8s ease-in-out infinite reverse' }} />
        <div className="hidden lg:block absolute top-1/2 right-[6%] w-20 h-20 rounded-[24px] bg-[var(--accent-blue)]/5 border border-[var(--accent-blue)]/8 -rotate-12" style={{ animation: 'floatShape 7s ease-in-out infinite' }} />
      </section>

      {/* ---- Features Section ---- */}
      <section
        ref={features.ref}
        className={`relative z-10 px-6 md:px-12 lg:px-20 pb-24 transition-all duration-700 delay-100 ${features.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-[1100px] mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <div className="text-[13px] font-semibold tracking-[0.16em] text-[var(--accent-primary)] uppercase mb-3">核心能力</div>
            <h2 className="display-font text-[28px] md:text-[36px] font-bold text-[#1a1f1a] leading-tight">
              一个平台，多种能力
            </h2>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group glass-panel rounded-[26px] p-7 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:border-[var(--accent-primary)]/15 cursor-default"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${f.color}12`, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="text-[17px] font-semibold text-[#1a1f1a] mb-2">{f.title}</h3>
                <p className="text-[14px] text-[var(--ink-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Bottom CTA ---- */}
      <section
        ref={cta.ref}
        className={`relative z-10 px-6 md:px-12 lg:px-20 pb-24 transition-all duration-700 delay-200 ${cta.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-[680px] mx-auto text-center">
          <div className="glass-panel-strong rounded-[36px] p-10 md:p-14">
            <h2 className="display-font text-[26px] md:text-[32px] font-bold text-[#1a1f1a] mb-4">
              准备好了吗？
            </h2>
            <p className="text-[15px] text-[var(--ink-secondary)] mb-8 max-w-[400px] mx-auto leading-relaxed">
              登录工作台，体验 AI 驱动的智能协作
            </p>
            <Button
              size="large"
              type="primary"
              onClick={() => navigate('/login')}
              className="btn-ripple !rounded-2xl !h-13 !px-10 !text-[16px] !font-semibold !bg-gradient-to-r !from-[var(--accent-primary)] !to-[#3d7a6f] !border-none shadow-xl shadow-[var(--accent-primary)]/25 hover:shadow-2xl hover:shadow-[var(--accent-primary)]/35 hover:!scale-[1.03] transition-all duration-300"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
            >
              进入工作台
            </Button>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="relative z-10 px-6 md:px-12 lg:px-20 py-8 border-t border-[var(--panel-border)]">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
              <ThunderboltOutlined className="text-white text-xs" />
            </div>
            <span className="text-[14px] font-semibold text-[#1a1f1a]">Agent Studio</span>
          </div>
          <div className="text-[13px] text-[var(--ink-tertiary)]">
            © {new Date().getFullYear()} Agent Studio
          </div>
        </div>
      </footer>

      {/* ---- Inline keyframes ---- */}
      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes floatShape {
          0%, 100% { transform: translateY(0) rotate(var(--r, 12deg)); }
          50% { transform: translateY(-12px) rotate(var(--r, 12deg)); }
        }
      `}</style>
    </div>
  );
}
