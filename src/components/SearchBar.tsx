import React, {
  useState,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  useRef,
} from 'react';
import axios from 'axios';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
  CommandSeparator,
} from '@/components/ui/command';

interface Temple {
  id: string;
  temple_name: string;
  location: string;
  description: string;
  lat: number;
  lng: number;
}

interface SearchBarProps {
  onSearch: (results: Temple[]) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recentTemples, setRecentTemples] = useState<Temple[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const totalItems =
    searchHistory.length + (recentTemples.length > 0 ? recentTemples.length : 0);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setIsDropdownOpen(true);
    setHighlightedIndex(null); // 重置高亮索引
  };

  const handleSearch = async (searchQuery?: string) => {
    const searchTerm = searchQuery || query;
    if (searchTerm.trim() === '') return;

    try {
      const response = await axios.get(
        `/api/temples/search?search=${encodeURIComponent(searchTerm)}`
      );
      onSearch(response.data);

      setSearchHistory((prevHistory) => {
        const updatedHistory = [
          searchTerm,
          ...prevHistory.filter((item) => item !== searchTerm),
        ];
        return updatedHistory.slice(0, 5);
      });
    } catch (error) {
      console.error('Error fetching search results:', error);
    }

    setIsDropdownOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setHighlightedIndex((prevIndex) => {
        if (prevIndex === null) {
          return 0;
        } else if (prevIndex < totalItems - 1) {
          return prevIndex + 1;
        } else {
          return prevIndex;
        }
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prevIndex) => {
        if (prevIndex === null || prevIndex === 0) {
          return null;
        } else {
          return prevIndex - 1;
        }
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex !== null) {
        // 根据高亮的索引获取对应的项
        const totalHistoryItems = searchHistory.length;
        if (highlightedIndex < totalHistoryItems) {
          const selectedHistoryItem = searchHistory[highlightedIndex];
          setQuery(selectedHistoryItem);
          handleSearch(selectedHistoryItem);
        } else {
          const templeIndex = highlightedIndex - totalHistoryItems;
          const selectedTemple = recentTemples[templeIndex];
          setQuery(selectedTemple.temple_name);
          handleSearch(selectedTemple.temple_name);
        }
      } else {
        handleSearch();
      }
      setHighlightedIndex(null);
    }
  };

  useEffect(() => {
    const fetchRecentTemples = async () => {
      try {
        const response = await axios.get<Temple[]>(
          '/api/temples/recent?limit=5'
        );
        console.log('Fetched recent temples:', response.data);
        setRecentTemples(response.data);
      } catch (error) {
        console.error('Error fetching recent temples:', error);
      }
    };

    fetchRecentTemples();
  }, []);

  // 添加全局点击事件监听器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setHighlightedIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 辅助函数：截取描述文本
  const truncateDescription = (description: any, charLimit: number) => {
    let descText = '';
    if (typeof description === 'string') {
      descText = description;
    } else if (typeof description === 'object' && description !== null) {
      descText = JSON.stringify(description);
    } else {
      console.log('Unknown description type:', description);
      return '';
    }

    // 解码 HTML 实体
    const decodedDescription = (() => {
      const txt = document.createElement('textarea');
      txt.innerHTML = descText;
      return txt.value;
    })();

    // 移除 HTML 标签
    const plainText = decodedDescription.replace(/<[^>]*>/g, '');
    // 移除多余的空白字符，包括换行符、制表符等
    const sanitizedDescription = plainText.replace(/\s+/g, ' ').trim();

    if (sanitizedDescription.length > charLimit) {
      return sanitizedDescription.substring(0, charLimit) + '...';
    }
    return sanitizedDescription;
  };

  return (
    <div
      ref={searchBarRef}
      className="rounded-lg border shadow-sm w-full max-w-lg"
    >
      <Command className="rounded-lg border-none">
        <CommandInput
          ref={inputRef}
          placeholder="尋找寺廟... Search temples..."
          value={query}
          onInput={handleInputChange}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          className="px-3 py-2 border-none focus:ring-0 focus:outline-none"
        />
        <CommandList className={`mt-2 ${isDropdownOpen ? '' : 'hidden'}`}>
          {searchHistory.length > 0 && (
            <CommandGroup heading="搜尋歷史 Search History">
              {searchHistory.map((item, index) => (
                <CommandItem
                  key={index}
                  onSelect={() => {
                    setQuery(item);
                    handleSearch(item);
                    setHighlightedIndex(null);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseLeave={() => setHighlightedIndex(null)}
                  className={`cursor-pointer ${
                    highlightedIndex === index ? 'bg-gray-100' : ''
                  }`}
                >
                  {item}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchHistory.length > 0 && recentTemples.length > 0 && (
            <CommandSeparator />
          )}

          {recentTemples.length > 0 ? (
            <CommandGroup heading="最新廟宇 Recently Added Temples">
              {recentTemples.map((temple, idx) => {
                const index = searchHistory.length + idx;
                return (
                  <CommandItem
                    key={temple.id}
                    onSelect={() => {
                      setQuery(temple.temple_name);
                      handleSearch(temple.temple_name);
                      setHighlightedIndex(null);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseLeave={() => setHighlightedIndex(null)}
                    tabIndex={-1} // 阻止默认聚焦
                    className={`cursor-pointer ${
                      highlightedIndex === index ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">
                        {temple.temple_name || '名稱未知'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {temple.location || '位置未知'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {temple.description
                          ? truncateDescription(temple.description, 100)
                          : '暫無描述'}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : (
            <CommandEmpty>
              最近沒有新增廟宇。No recent temples found.
            </CommandEmpty>
          )}
        </CommandList>
      </Command>
    </div>
  );
}
