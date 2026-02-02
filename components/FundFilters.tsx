/**
 * Fund Filters and Sort Component
 */

'use client';

import { useState } from 'react';

interface FundFiltersProps {
  funds: any[];
  children: (filteredFunds: any[]) => React.ReactNode;
}

type SortOption = 'default' | 'nameAsc' | 'nameDesc' | 'navDesc' | 'navAsc' | 'changeDesc' | 'changeAsc';
type FilterType = 'all' | 'stock' | 'bond' | 'mixed' | 'index' | 'money';

export function FundFilters({ funds, children }: FundFiltersProps) {
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // 计算筛选和排序后的基金
  const getFilteredFunds = () => {
    let result = [...funds];

    // 应用类型筛选
    if (filterType !== 'all') {
      result = result.filter(f => {
        const type = (f.type || '').toLowerCase();
        switch (filterType) {
          case 'stock':
            return type.includes('stock') || type.includes('股票');
          case 'bond':
            return type.includes('bond') || type.includes('债券');
          case 'mixed':
            return type.includes('mixed') || type.includes('混合');
          case 'index':
            return type.includes('index') || type.includes('指数');
          case 'money':
            return type.includes('money') || type.includes('货币');
          default:
            return true;
        }
      });
    }

    // 应用排序
    switch (sortBy) {
      case 'nameAsc':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'));
        break;
      case 'nameDesc':
        result.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'zh-CN'));
        break;
      case 'navDesc':
        result.sort((a, b) => parseFloat(b.dwjz || b.gsz || 0) - parseFloat(a.dwjz || a.gsz || 0));
        break;
      case 'navAsc':
        result.sort((a, b) => parseFloat(a.dwjz || a.gsz || 0) - parseFloat(b.dwjz || b.gsz || 0));
        break;
      case 'changeDesc':
        result.sort((a, b) => (Number(b.gszzl) || 0) - (Number(a.gszzl) || 0));
        break;
      case 'changeAsc':
        result.sort((a, b) => (Number(a.gszzl) || 0) - (Number(b.gszzl) || 0));
        break;
      default:
        break;
    }

    return result;
  };

  const filteredFunds = getFilteredFunds();
  const sortOptions = [
    { value: 'default', label: '默认' },
    { value: 'nameAsc', label: '名称A-Z' },
    { value: 'nameDesc', label: '名称Z-A' },
    { value: 'navDesc', label: '净值降序' },
    { value: 'navAsc', label: '净值升序' },
    { value: 'changeDesc', label: '涨幅降序' },
    { value: 'changeAsc', label: '涨幅升序' },
  ];

  const filterOptions = [
    { value: 'all', label: '全部', icon: 'all' },
    { value: 'stock', label: '股票型', icon: 'S' },
    { value: 'mixed', label: '混合型', icon: 'M' },
    { value: 'bond', label: '债券型', icon: 'B' },
    { value: 'index', label: '指数型', icon: 'I' },
    { value: 'money', label: '货币型', icon: '$' },
  ];

  const activeFilterCount = (filterType !== 'all' ? 1 : 0) + (sortBy !== 'default' ? 1 : 0);

  return (
    <>
      <div className="fund-filters">
        <div className="filters-toolbar">
          <div className="filters-left">
            <div className="filter-dropdown" style={{ position: 'relative' }}>
              <button
                className={`filter-button ${filterType !== 'all' ? 'active' : ''}`}
                onClick={() => setShowFilterMenu(!showFilterMenu)}
              >
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="filter-badge">{activeFilterCount}</span>
                )}
              </button>

              {showFilterMenu && (
                <div className="filter-menu">
                  <div className="filter-menu-header">类型</div>
                  {filterOptions.map(option => (
                    <button
                      key={option.value}
                      className={`filter-option ${filterType === option.value ? 'selected' : ''}`}
                      onClick={() => {
                        setFilterType(option.value as FilterType);
                        setShowFilterMenu(false);
                      }}
                    >
                      <span className="filter-icon">{option.icon}</span>
                      <span>{option.label}</span>
                      {filterType === option.value && (
                        <span className="check-mark">OK</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filterType !== 'all' && (
              <div className="active-filter-tag">
                <span>{filterOptions.find(o => o.value === filterType)?.label}</span>
                <button
                  className="clear-filter"
                  onClick={() => setFilterType('all')}
                >
                  X
                </button>
              </div>
            )}
          </div>

          <div className="filters-right">
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <span className="result-count">
              Total: <strong>{filteredFunds.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {showFilterMenu && (
        <div
          className="filter-overlay"
          onClick={() => setShowFilterMenu(false)}
        />
      )}

      {/* 渲染子组件，传入筛选后的基金 */}
      {children(filteredFunds)}
    </>
  );
}

export default FundFilters;
