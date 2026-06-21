import React, { useState } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { useAuth } from "../../context/AuthContext";


export const EntrepreneursPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedFundingRange, setSelectedFundingRange] = useState<string[]>(
    [],
  );
  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  

  React.useEffect(() => {
    const fetchAllStartups = async () => {
      try {
        const token = localStorage.getItem("business_nexus_token");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/users/entrepreneurs`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setEntrepreneurs(data); 
        } else {
          console.error("Failed to fetch startups");
        }
      } catch (error) {
        console.error("Network error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStartups();
  }, []);

  // Get unique industries and funding ranges
  const allIndustries = Array.from(
    new Set(entrepreneurs.map((e) => e.industry)),
  );
  const fundingRanges = ["< $500K", "$500K - $1M", "$1M - $5M", "> $5M"];

  // Filter entrepreneurs based on search and filters safely
  const filteredEntrepreneurs = entrepreneurs.filter((entrepreneur) => {
    if (user && String(entrepreneur.id) === String(user.id)) return false;
    const searchLower = searchQuery.toLowerCase();

    // SAFE STRING MATCHING: Adding (variable || '') prevents null crashes
    const matchesSearch =
      searchQuery === "" ||
      (entrepreneur.name || "").toLowerCase().includes(searchLower) ||
      (entrepreneur.startupName || "").toLowerCase().includes(searchLower) ||
      (entrepreneur.industry || "").toLowerCase().includes(searchLower) ||
      (entrepreneur.pitchSummary || "").toLowerCase().includes(searchLower);

    const matchesIndustry =
      selectedIndustries.length === 0 ||
      selectedIndustries.includes(entrepreneur.industry);

    // SAFE NUMBER PARSING: Fallback to '0' if fundingNeeded is null
    const matchesFunding =
      selectedFundingRange.length === 0 ||
      selectedFundingRange.some((range) => {
        const fundingStr = entrepreneur.fundingNeeded || "0";
        const amount = parseInt(fundingStr.replace(/[^0-9]/g, "")) || 0;

        switch (range) {
          case "< $500K":
            return amount > 0 && amount < 500;
          case "$500K - $1M":
            return amount >= 500 && amount <= 1000;
          case "$1M - $5M":
            return amount > 1000 && amount <= 5000;
          case "> $5M":
            return amount > 5000;
          default:
            return true;
        }
      });

    return matchesSearch && matchesIndustry && matchesFunding;
  });

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry],
    );
  };

  const toggleFundingRange = (range: string) => {
    setSelectedFundingRange((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range],
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Startups</h1>
        <p className="text-gray-600">
          Discover promising startups looking for investment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Industry
                </h3>
                <div className="space-y-2">
                  {allIndustries.map((industry) => (
                    <button
                      key={industry}
                      onClick={() => toggleIndustry(industry)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedIndustries.includes(industry)
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Funding Range
                </h3>
                <div className="space-y-2">
                  {fundingRanges.map((range) => (
                    <button
                      key={range}
                      onClick={() => toggleFundingRange(range)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedFundingRange.includes(range)
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Location
                </h3>
                <div className="space-y-2">
                  <button className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    <MapPin size={16} className="mr-2" />
                    San Francisco, CA
                  </button>
                  <button className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    <MapPin size={16} className="mr-2" />
                    New York, NY
                  </button>
                  <button className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    <MapPin size={16} className="mr-2" />
                    Boston, MA
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search startups by name, industry, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />

            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {filteredEntrepreneurs.length} results
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEntrepreneurs.map((entrepreneur) => (
              <EntrepreneurCard
                key={entrepreneur.id}
                entrepreneur={entrepreneur}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};