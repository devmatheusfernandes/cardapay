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
    // Make the component sticky within its grid column on large screens
    <div className="lg:sticky lg:top-24">
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Procurar..."
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Vertical list of category filters */}
      <div className="flex flex-col space-y-2">
        <h3 className="px-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">Categorias</h3>
        <button
          onClick={() => setActiveCategory(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!activeCategory ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          Todas
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => {
              setActiveCategory(category);
              scrollToCategory(category);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === category ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}