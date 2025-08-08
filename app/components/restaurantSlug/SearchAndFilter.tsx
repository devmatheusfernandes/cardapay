import { Search } from 'lucide-react';

interface SearchAndFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: string[];
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
  scrollToCategory: (category: string) => void;
}

export function SearchAndFilter({ 
  searchQuery, 
  setSearchQuery, 
  categories, 
  activeCategory, 
  setActiveCategory, 
  scrollToCategory 
}: SearchAndFilterProps) {
  return (
    <div className="sticky top-16 z-20 bg-white py-4 mb-8 border-b">
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search menu items..."
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full whitespace-nowrap mr-2 text-sm font-medium transition-colors ${!activeCategory ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All Items
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => {
              setActiveCategory(category);
              scrollToCategory(category);
            }}
            className={`px-4 py-2 rounded-full whitespace-nowrap mr-2 text-sm font-medium transition-colors ${activeCategory === category ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

