'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EnhancedAIChat } from '../components/EnhancedAIChat';
import { ImageRecognitionButton } from '../components/ImageRecognitionButton';
import { SmartRecommendations } from '../components/SmartRecommendations';
import { RiskDashboard } from '../components/RiskDashboard';
import { FundDetailModal } from '../components/FundDetailModal';
import { FundFilters } from '../components/FundFilters';
import { PortfolioStats } from '../components/PortfolioStats';
import { FundCompare, CompareButton } from '../components/FundCompare';
import { ThemeToggle } from '../components/ThemeToggle';

function PlusIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6l1-2h6l1 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 6l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a7.97 7.97 0 0 0 .1-2l2-1.5-2-3.5-2.3.5a8.02 8.02 0 0 0-1.7-1l-.4-2.3h-4l-.4 2.3a8.02 8.02 0 0 0-1.7 1l-2.3-.5-2 3.5 2 1.5a7.97 7.97 0 0 0 .1 2l-2 1.5 2 3.5 2.3-.5a8.02 8.02 0 0 0 1.7 1l.4 2.3h4l.4-2.3a8.02 8.02 0 0 0 1.7-1l2.3.5 2-3.5-2-1.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path d="M4 12a8 8 0 0 1 12.5-6.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 5h3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12a8 8 0 0 1-12.5 6.9" stroke="currentColor" strokeWidth="2" />
      <path d="M8 19H5v-3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ChevronIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ filled, ...props }) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "var(--accent)" : "none"}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Stat({ label, value, delta }) {
  const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : '';
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <span className={`value ${dir}`}>{value}</span>
      {typeof delta === 'number' && (
        <span className={`badge ${dir}`}>
          {delta > 0 ? '↗' : delta < 0 ? '↘' : '—'} {Math.abs(delta).toFixed(2)}%
        </span>
      )}
    </div>
  );
}

export default function HomePage() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // 搜索相关状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  const [searchPosition, setSearchPosition] = useState({ top: 0, left: 0 });

  // 刷新频率状态
  const [refreshMs, setRefreshMs] = useState(30000);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempSeconds, setTempSeconds] = useState(30);

  // 全局刷新状态
  const [refreshing, setRefreshing] = useState(false);

  // 收起/展开状态
  const [collapsedCodes, setCollapsedCodes] = useState(new Set());

  // 自选状态
  const [favorites, setFavorites] = useState(new Set());
  const [currentTab, setCurrentTab] = useState('all');

  // 详情弹窗状态
  const [selectedFund, setSelectedFund] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 筛选后的基金列表
  const [filteredFunds, setFilteredFunds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // 基金对比状态
  const [comparingFunds, setComparingFunds] = useState([]);

  // 当基金列表或标签页变化时更新筛选列表
  useEffect(() => {
    const tabFiltered = funds.filter(f => currentTab === 'all' || favorites.has(f.code));
    setFilteredFunds(tabFiltered);
  }, [funds, currentTab]);

  const toggleFavorite = (code) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      localStorage.setItem('favorites', JSON.stringify(Array.from(next)));
      if (next.size === 0) setCurrentTab('all');
      return next;
    });
  };

  const toggleCollapse = (code) => {
    setCollapsedCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      // 同步到本地存储
      localStorage.setItem('collapsedCodes', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // 对比功能处理
  const toggleCompare = (fund) => {
    setComparingFunds(prev => {
      const exists = prev.find(f => f.code === fund.code);
      if (exists) {
        return prev.filter(f => f.code !== fund.code);
      } else {
        if (prev.length >= 5) {
          alert('最多只能对比5只基金');
          return prev;
        }
        return [...prev, fund];
      }
    });
  };

  const clearCompare = () => {
    setComparingFunds([]);
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('funds') || '[]');
      if (Array.isArray(saved) && saved.length) {
        setFunds(saved);
        refreshAll(saved.map((f) => f.code));
      }
      const savedMs = parseInt(localStorage.getItem('refreshMs') || '30000', 10);
      if (Number.isFinite(savedMs) && savedMs >= 5000) {
        setRefreshMs(savedMs);
        setTempSeconds(Math.round(savedMs / 1000));
      }
      // 加载收起状态
      const savedCollapsed = JSON.parse(localStorage.getItem('collapsedCodes') || '[]');
      if (Array.isArray(savedCollapsed)) {
        setCollapsedCodes(new Set(savedCollapsed));
      }
      // 加载自选状态
      const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (Array.isArray(savedFavorites)) {
        setFavorites(new Set(savedFavorites));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const codes = funds.map((f) => f.code);
      if (codes.length) refreshAll(codes);
    }, refreshMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [funds, refreshMs]);

  // --- 辅助：JSONP 数据抓取逻辑 ---
  const loadScript = (url) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => {
        document.body.removeChild(script);
        resolve();
      };
      script.onerror = () => {
        document.body.removeChild(script);
        reject(new Error('数据加载失败'));
      };
      document.body.appendChild(script);
    });
  };

  const fetchFundData = async (c) => {
    return new Promise(async (resolve, reject) => {
      // 腾讯接口识别逻辑优化
      const getTencentPrefix = (code) => {
        if (code.startsWith('6') || code.startsWith('9')) return 'sh';
        if (code.startsWith('0') || code.startsWith('3')) return 'sz';
        if (code.startsWith('4') || code.startsWith('8')) return 'bj';
        return 'sz';
      };

      const gzUrl = `https://fundgz.1234567.com.cn/js/${c}.js?rt=${Date.now()}`;
      
      // 使用更安全的方式处理全局回调，避免并发覆盖
      const currentCallback = `jsonpgz_${c}_${Math.random().toString(36).slice(2, 7)}`;
      
      // 动态拦截并处理 jsonpgz 回调
      const scriptGz = document.createElement('script');
      // 东方财富接口固定调用 jsonpgz，我们通过修改全局变量临时捕获它
      scriptGz.src = gzUrl;
      
      const originalJsonpgz = window.jsonpgz;
      window.jsonpgz = (json) => {
        window.jsonpgz = originalJsonpgz; // 立即恢复
        const gszzlNum = Number(json.gszzl);
        const gzData = {
          code: json.fundcode,
          name: json.name,
          dwjz: json.dwjz,
          gsz: json.gsz,
          gztime: json.gztime,
          gszzl: Number.isFinite(gszzlNum) ? gszzlNum : json.gszzl
        };
        
        // 获取重仓股票列表
        const holdingsUrl = `https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=${c}&topline=10&year=&month=&rt=${Date.now()}`;
        loadScript(holdingsUrl).then(async () => {
          let holdings = [];
          const html = window.apidata?.content || '';
          const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
          for (const r of rows) {
            const cells = (r.match(/<td[\s\S]*?>([\s\S]*?)<\/td>/gi) || []).map(td => td.replace(/<[^>]*>/g, '').trim());
            const codeIdx = cells.findIndex(txt => /^\d{6}$/.test(txt));
            const weightIdx = cells.findIndex(txt => /\d+(?:\.\d+)?\s*%/.test(txt));
            if (codeIdx >= 0 && weightIdx >= 0) {
              holdings.push({
                code: cells[codeIdx],
                name: cells[codeIdx + 1] || '',
                weight: cells[weightIdx],
                change: null
              });
            }
          }
          
          holdings = holdings.slice(0, 10);
          
          if (holdings.length) {
            try {
              const tencentCodes = holdings.map(h => `s_${getTencentPrefix(h.code)}${h.code}`).join(',');
              const quoteUrl = `https://qt.gtimg.cn/q=${tencentCodes}`;
              
              await new Promise((resQuote) => {
                const scriptQuote = document.createElement('script');
                scriptQuote.src = quoteUrl;
                scriptQuote.onload = () => {
                  holdings.forEach(h => {
                    const varName = `v_s_${getTencentPrefix(h.code)}${h.code}`;
                    const dataStr = window[varName];
                    if (dataStr) {
                      const parts = dataStr.split('~');
                      // parts[5] 是涨跌幅
                      if (parts.length > 5) {
                        h.change = parseFloat(parts[5]);
                      }
                    }
                  });
                  if (document.body.contains(scriptQuote)) document.body.removeChild(scriptQuote);
                  resQuote();
                };
                scriptQuote.onerror = () => {
                  if (document.body.contains(scriptQuote)) document.body.removeChild(scriptQuote);
                  resQuote();
                };
                document.body.appendChild(scriptQuote);
              });
            } catch (e) {
              console.error('获取股票涨跌幅失败', e);
            }
          }
          
          resolve({ ...gzData, holdings });
        }).catch(() => resolve({ ...gzData, holdings: [] }));
      };

      scriptGz.onerror = () => {
        window.jsonpgz = originalJsonpgz;
        if (document.body.contains(scriptGz)) document.body.removeChild(scriptGz);
        reject(new Error('基金数据加载失败'));
      };

      document.body.appendChild(scriptGz);
      // 加载完立即移除脚本
      setTimeout(() => {
        if (document.body.contains(scriptGz)) document.body.removeChild(scriptGz);
      }, 5000);
    });
  };

  const refreshAll = async (codes) => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      // 改用串行请求，避免全局回调 jsonpgz 并发冲突
      const updated = [];
      for (const c of codes) {
        try {
          const data = await fetchFundData(c);
          updated.push(data);
        } catch (e) {
          console.error(`刷新基金 ${c} 失败`, e);
          // 失败时保留旧数据
          const old = funds.find(f => f.code === c);
          if (old) updated.push(old);
        }
      }
      if (updated.length) {
        setFunds(updated);
        localStorage.setItem('funds', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const removeFund = (removeCode) => {
    const next = funds.filter((f) => f.code !== removeCode);
    setFunds(next);
    localStorage.setItem('funds', JSON.stringify(next));

    // 同步删除展开收起状态
    setCollapsedCodes(prev => {
      if (!prev.has(removeCode)) return prev;
      const nextSet = new Set(prev);
      nextSet.delete(removeCode);
      localStorage.setItem('collapsedCodes', JSON.stringify(Array.from(nextSet)));
      return nextSet;
    });

    // 同步删除自选状态
    setFavorites(prev => {
      if (!prev.has(removeCode)) return prev;
      const nextSet = new Set(prev);
      nextSet.delete(removeCode);
      localStorage.setItem('favorites', JSON.stringify(Array.from(nextSet)));
      if (nextSet.size === 0) setCurrentTab('all');
      return nextSet;
    });
  };

  const manualRefresh = async () => {
    if (refreshing) return;
    const codes = funds.map((f) => f.code);
    if (!codes.length) return;
    await refreshAll(codes);
  };

  const saveSettings = (e) => {
    e?.preventDefault?.();
    const ms = Math.max(5, Number(tempSeconds)) * 1000;
    setRefreshMs(ms);
    localStorage.setItem('refreshMs', String(ms));
    setSettingsOpen(false);
  };

  // 搜索基金（带防抖）
  const searchFunds = async (keyword) => {
    // 清除之前的定时器
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!keyword.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchLoading(false);
      return;
    }

    // 设置防抖延迟
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        // 使用天天基金网的搜索接口
        // 返回格式: var r = [["基金代码","基金简称","基金类型","拼音"],...]
        const url = `https://fund.eastmoney.com/js/fundcode_search.js?timestamp=${Date.now()}`;

        const data = await new Promise((resolve) => {
          const script = document.createElement('script');

          // 东方财富接口会将结果赋值给 window.r
          // 脚本加载完成后，window.r 会被设置
          script.onload = () => {
            // 直接从 window.r 获取数据
            const result = window.r || [];
            // 移除脚本标签
            if (document.body.contains(script)) {
              document.body.removeChild(script);
            }
            resolve(result);
          };

          script.onerror = () => {
            if (document.body.contains(script)) {
              document.body.removeChild(script);
            }
            resolve([]);
          };

          script.src = url;
          document.body.appendChild(script);
        });

        if (Array.isArray(data)) {
          // 过滤匹配的结果
          const filtered = data.filter(fund => {
            const code = fund[0] || '';
            const name = fund[2] || '';
            const pinyin = fund[3] || '';
            return code.includes(keyword) ||
                   name.toLowerCase().includes(keyword.toLowerCase()) ||
                   pinyin.toLowerCase().includes(keyword.toLowerCase());
          }).slice(0, 20); // 限制结果数量

          setSearchResults(filtered.map(fund => ({
            code: fund[0],
            name: fund[2],
            type: fund[3]
          })));

          // 计算搜索框位置用于定位下拉列表
          if (searchInputRef.current) {
            const rect = searchInputRef.current.getBoundingClientRect();
            setSearchPosition({
              top: rect.bottom + 8,
              left: rect.left + rect.width / 2
            });
          }
          setShowSearchResults(true);
        }
      } catch (e) {
        console.error('搜索失败', e);
        setSearchResults([]);
        setShowSearchResults(true);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // 300ms 防抖延迟
  };

  // 添加基金（支持搜索结果或直接代码）
  const addFundFromSearch = async (fundCode) => {
    if (funds.some((f) => f.code === fundCode)) {
      setError('该基金已添加');
      setShowSearchResults(false);
      setSearchKeyword('');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchFundData(fundCode);
      const next = [data, ...funds];
      setFunds(next);
      localStorage.setItem('funds', JSON.stringify(next));
      setShowSearchResults(false);
      setSearchKeyword('');
    } catch (e) {
      setError(e.message || '添加失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === 'Escape' && settingsOpen) setSettingsOpen(false);
      if (ev.key === 'Escape' && showSearchResults) {
        setShowSearchResults(false);
        setSearchKeyword('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen, showSearchResults]);

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSearchResults && !e.target.closest('.search-results') && !e.target.closest('.input')) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchResults]);

  return (
    <div className="container content">
      <div className="navbar glass">
        {refreshing && <div className="loading-bar"></div>}
        <div className="brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="2" />
            <path d="M5 14c2-4 7-6 14-5" stroke="var(--primary)" strokeWidth="2" />
          </svg>
          <span>实时基金估值</span>
        </div>
        <div className="actions">
          <div className="badge" title="当前刷新频率">
            <span>刷新</span>
            <strong>{Math.round(refreshMs / 1000)}秒</strong>
          </div>
          <button
            className="icon-button"
            aria-label="立即刷新"
            onClick={manualRefresh}
            disabled={refreshing || funds.length === 0}
            aria-busy={refreshing}
            title="立即刷新"
          >
            <RefreshIcon className={refreshing ? 'spin' : ''} width="18" height="18" />
          </button>
          <ThemeToggle />
          <button
            className="icon-button"
            aria-label="打开设置"
            onClick={() => setSettingsOpen(true)}
            title="设置"
          >
            <SettingsIcon width="18" height="18" />
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="col-12 glass card add-fund-section" role="region" aria-label="添加基金">
          <div className="title" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusIcon width="20" height="20" />
              <span>添加基金</span>
            </div>
            <div className="muted" style={{ fontSize: '13px', marginTop: '4px', paddingLeft: '28px' }}>
              输入基金名称搜索，或直接输入代码（如110022）回车添加
            </div>
          </div>

          <div style={{ position: 'relative' }} ref={searchInputRef}>
            <div className="form">
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  className="input"
                  placeholder="输入基金代码（如110022）或名称搜索..."
                  value={searchKeyword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchKeyword(value);
                    searchFunds(value);
                  }}
                  onKeyDown={(e) => {
                    // 纯数字代码按回车直接添加
                    if (e.key === 'Enter' && /^\d{6}$/.test(searchKeyword.trim())) {
                      e.preventDefault();
                      addFundFromSearch(searchKeyword.trim());
                    }
                  }}
                />
                {searchLoading && (
                  <div style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted)',
                    fontSize: '12px'
                  }}>
                    搜索中...
                  </div>
                )}
              </div>
              <button
                className="button"
                type="button"
                onClick={() => {
                  // 纯数字代码直接添加
                  if (/^\d{6}$/.test(searchKeyword.trim())) {
                    addFundFromSearch(searchKeyword.trim());
                  }
                }}
                disabled={loading || !searchKeyword.trim()}
              >
                {loading ? '添加中…' : '添加'}
              </button>
              {/* 图片识别按钮 */}
              <ImageRecognitionButton
                onAddFund={addFundFromSearch}
                existingFunds={funds.map(f => f.code)}
              />
            </div>
            <div className="muted" style={{ marginTop: 8, fontSize: '12px' }}>
              支持截图识别添加（支付宝/天天基金截图）
            </div>
          </div>

          {/* 搜索结果下拉框 - 使用 Portal 渲染到 body */}
          {showSearchResults && typeof document !== 'undefined' && createPortal(
            <div className="search-results" style={{ top: `${searchPosition.top}px`, left: `${searchPosition.left}px` }}>
              {searchResults.length > 0 ? (
                searchResults.map((fund) => (
                  <div
                    key={fund.code}
                    className="search-result-item"
                    onClick={() => addFundFromSearch(fund.code)}
                    onMouseDown={(e) => {
                      // 防止点击事件被 input 的 blur 事件阻止
                      e.preventDefault();
                    }}
                  >
                    <div className="search-result-info">
                      <span className="search-result-name">{fund.name}</span>
                      <span className="muted">#{fund.code}</span>
                    </div>
                    {funds.some(f => f.code === fund.code) && (
                      <span className="search-result-added">已添加</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="search-results-empty">
                  <div className="muted">未找到匹配的基金</div>
                </div>
              )}
            </div>,
            document.body
          )}

          {error && <div className="muted" style={{ marginTop: 8, color: 'var(--danger)' }}>{error}</div>}
        </div>

        <div className="col-12">
          {funds.length > 0 && favorites.size > 0 && (
            <div className="tabs" style={{ marginBottom: 16 }}>
              <button 
                className={`tab ${currentTab === 'all' ? 'active' : ''}`}
                onClick={() => setCurrentTab('all')}
              >
                全部 ({funds.length})
              </button>
              <button 
                className={`tab ${currentTab === 'fav' ? 'active' : ''}`}
                onClick={() => setCurrentTab('fav')}
              >
                自选 ({favorites.size})
              </button>
            </div>
          )}

          {funds.length === 0 ? (
            <div className="glass card empty" style={{
              padding: '60px 40px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--card-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--muted)' }}>
                  <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>尚未添加基金</div>
              <div style={{ fontSize: '14px', color: 'var(--muted)' }}>在上方输入基金名称或代码，点击添加您的第一个基金</div>
            </div>
          ) : (
            /* 基金筛选和排序组件 - 使用 children render prop 模式 */
            <FundFilters funds={filteredFunds}>
              {(filteredFunds) => (
                <div className="grid">
                  {filteredFunds.map((f) => (
                    <div key={f.code} className="col-6">
                      <div
                        className="glass card fund-card"
                        onClick={() => {
                          setSelectedFund(f);
                          setShowDetailModal(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                    <div className="row" style={{ marginBottom: 10 }}>
                      <div className="title">
                        <button
                          className={`icon-button fav-button ${favorites.has(f.code) ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(f.code);
                          }}
                          title={favorites.has(f.code) ? "取消自选" : "添加自选"}
                        >
                          <StarIcon width="18" height="18" filled={favorites.has(f.code)} />
                        </button>
                        <span>{f.name}</span>
                        <span className="muted">#{f.code}</span>
                      </div>
                      <div className="actions">
                        <CompareButton
                          fund={f}
                          isComparing={comparingFunds.some(cf => cf.code === f.code)}
                          onToggle={() => toggleCompare(f)}
                        />
                        <div className="badge-v">
                          <span>估值时间</span>
                          <strong>{f.gztime || f.time || '-'}</strong>
                        </div>
                        <button
                          className="icon-button danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFund(f.code);
                          }}
                          title="删除"
                        >
                          <TrashIcon width="18" height="18" />
                        </button>
                      </div>
                    </div>
                    <div className="row" style={{ marginBottom: 12 }}>
                      <Stat label="单位净值" value={f.dwjz ?? '—'} />
                      <Stat label="估值净值" value={f.gsz ?? '—'} />
                      <Stat label="涨跌幅" value={typeof f.gszzl === 'number' ? `${f.gszzl.toFixed(2)}%` : f.gszzl ?? '—'} delta={Number(f.gszzl) || 0} />
                    </div>
                    <div
                      style={{ marginBottom: 8, cursor: 'pointer', userSelect: 'none' }}
                      className="title"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollapse(f.code);
                      }}
                    >
                      <div className="row" style={{ width: '100%', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>前10重仓股票</span>
                          <ChevronIcon
                            width="16"
                            height="16"
                            className="muted"
                            style={{
                              transform: collapsedCodes.has(f.code) ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease'
                            }}
                          />
                        </div>
                        <span className="muted">涨跌幅 / 占比</span>
                      </div>
                    </div>
                    {Array.isArray(f.holdings) && f.holdings.length ? (
                      <div className={`list ${collapsedCodes.has(f.code) ? 'collapsed' : ''}`} style={{
                        display: collapsedCodes.has(f.code) ? 'none' : 'grid'
                      }}>
                        {f.holdings.map((h, idx) => (
                          <div className="item" key={idx}>
                            <span className="name">{h.name}</span>
                            <div className="values">
                              {typeof h.change === 'number' && (
                                <span className={`badge ${h.change > 0 ? 'up' : h.change < 0 ? 'down' : ''}`} style={{ marginRight: 8 }}>
                                  {h.change > 0 ? '+' : ''}{h.change.toFixed(2)}%
                                </span>
                              )}
                              <span className="weight">{h.weight}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="muted" style={{ display: collapsedCodes.has(f.code) ? 'none' : 'block' }}>暂无重仓数据</div>
                    )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FundFilters>
          )}
        </div>
      </div>

      {/* 智能推荐组件 - 仅在没有基金时显示 */}
      {funds.length === 0 && (
        <div className="grid">
          <div className="col-12">
            <SmartRecommendations />
          </div>
        </div>
      )}

      {/* 风险分析仪表板 - 仅在有基金时显示 */}
      {funds.length > 0 && (
        <>
          {/* 数据统计 */}
          <div className="grid">
            <div className="col-12">
              <div className="glass card" style={{ padding: '20px' }}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
                  数据统计
                </h2>
                <PortfolioStats funds={funds} />
              </div>
            </div>
          </div>

          {/* 风险分析 */}
          <div className="grid">
            <div className="col-12">
              <div className="glass card" style={{ padding: '20px' }}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
                  风险分析
                </h2>
                <RiskDashboard funds={funds} />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="footer">数据源：实时估值与重仓直连东方财富，无需后端，部署即用</div>

      {/* AI 聊天组件 - 使用增强版 */}
      <EnhancedAIChat funds={funds} />

      {/* 基金详情弹窗 */}
      {showDetailModal && selectedFund && (
        <FundDetailModal
          fund={selectedFund}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedFund(null);
          }}
          onToggleFavorite={toggleFavorite}
          isFavorite={favorites.has(selectedFund.code)}
          onRemove={removeFund}
        />
      )}

      {/* 基金对比组件 */}
      <FundCompare
        funds={funds}
        comparingFunds={comparingFunds}
        onAddToCompare={toggleCompare}
        onRemoveFromCompare={(code) => {
          setComparingFunds(prev => prev.filter(f => f.code !== code));
        }}
        onClearAll={clearCompare}
      />

      {settingsOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="设置" onClick={() => setSettingsOpen(false)}>
          <div className="glass card modal" onClick={(e) => e.stopPropagation()}>
            <div className="title" style={{ marginBottom: 12 }}>
              <SettingsIcon width="20" height="20" />
              <span>设置</span>
              <span className="muted">配置刷新频率</span>
            </div>
            
            <div className="form-group" style={{ marginBottom: 16 }}>
              <div className="muted" style={{ marginBottom: 8, fontSize: '0.8rem' }}>刷新频率</div>
              <div className="chips" style={{ marginBottom: 12 }}>
                {[10, 30, 60, 120, 300].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`chip ${tempSeconds === s ? 'active' : ''}`}
                    onClick={() => setTempSeconds(s)}
                    aria-pressed={tempSeconds === s}
                  >
                    {s} 秒
                  </button>
                ))}
              </div>
              <input
                className="input"
                type="number"
                min="5"
                step="5"
                value={tempSeconds}
                onChange={(e) => setTempSeconds(Number(e.target.value))}
                placeholder="自定义秒数"
              />
            </div>

            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="button" onClick={saveSettings}>保存并关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
