import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, MapPin, Trash2, AlertTriangle, CheckCircle, XCircle, Filter, Download } from 'lucide-react';
import api from '@/lib/api';

interface BinHistoryRecord {
  id: string;
  binId: string;
  timestamp: string;
  weight: number;
  distance: number;
  binLevel: number;
  gps: {
    lat: number;
    lng: number;
  };
  gpsValid: boolean;
  satellites: number;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

interface BinHistoryStats {
  totalRecords: number;
  criticalCount: number;
  warningCount: number;
  normalCount: number;
  errorCount: number;
  malfunctionCount: number;
}

export function BinHistory() {
  const [binHistory, setBinHistory] = useState<BinHistoryRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<BinHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BinHistoryStats>({
    totalRecords: 0,
    criticalCount: 0,
    warningCount: 0,
    normalCount: 0,
    errorCount: 0,
    malfunctionCount: 0
  });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [binIdFilter, setBinIdFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Fetch bin history data
  useEffect(() => {
    fetchBinHistory();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = binHistory;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.binId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.errorMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Bin ID filter
    if (binIdFilter !== 'all') {
      filtered = filtered.filter(record => record.binId === binIdFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(record => new Date(record.timestamp) >= filterDate);
    }

    setFilteredHistory(filtered);
    setCurrentPage(1);
  }, [binHistory, searchTerm, statusFilter, binIdFilter, dateFilter]);

  const fetchBinHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bin-history');
      
      if (response.data && response.data.success && response.data.records) {
        setBinHistory(response.data.records);
        setStats(response.data.stats || {
          totalRecords: response.data.records.length,
          criticalCount: response.data.records.filter((r: BinHistoryRecord) => r.status === 'CRITICAL').length,
          warningCount: response.data.records.filter((r: BinHistoryRecord) => r.status === 'WARNING').length,
          normalCount: response.data.records.filter((r: BinHistoryRecord) => r.status === 'OK').length,
          errorCount: response.data.records.filter((r: BinHistoryRecord) => r.status === 'ERROR').length,
          malfunctionCount: response.data.records.filter((r: BinHistoryRecord) => r.status === 'MALFUNCTION').length
        });
      } else {
        setBinHistory([]);
        setError(response.data?.message || 'No data received');
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching bin history:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch bin history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CRITICAL':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Critical</Badge>;
      case 'WARNING':
        return <Badge variant="outline" className="flex items-center gap-1 text-yellow-600 border-yellow-600"><AlertTriangle className="w-3 h-3" />Warning</Badge>;
      case 'OK':
        return <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600"><CheckCircle className="w-3 h-3" />Normal</Badge>;
      case 'ERROR':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Error</Badge>;
      case 'MALFUNCTION':
        return <Badge variant="destructive" className="flex items-center gap-1 text-orange-600 bg-orange-100 border-orange-600"><XCircle className="w-3 h-3" />Malfunction</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const formatCoordinates = (gps: { lat: number; lng: number }) => {
    return `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`;
  };

  const exportToCSV = () => {
    const headers = ['Bin ID', 'Timestamp', 'Weight (kg)', 'Distance (cm)', 'Bin Level (%)', 'GPS Coordinates', 'Status', 'Error Message'];
    const csvData = filteredHistory.map(record => [
      record.binId,
      record.timestamp,
      record.weight,
      record.distance,
      record.binLevel,
      formatCoordinates(record.gps),
      record.status,
      record.errorMessage || ''
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bin-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredHistory.slice(startIndex, endIndex);

  // Get unique bin IDs for filter
  const uniqueBinIds = Array.from(new Set(binHistory.map(record => record.binId)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bin history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bin History</h1>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
              </div>
              
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticalCount}</p>
              </div>
             
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warning</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warningCount}</p>
              </div>
              
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Normal</p>
                <p className="text-2xl font-bold text-green-600">{stats.normalCount}</p>
              </div>
              
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-gray-600">{stats.errorCount}</p>
              </div>
         
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Malfunction</p>
                <p className="text-2xl font-bold text-orange-600">{stats.malfunctionCount}</p>
              </div>
            
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="ok">Normal</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="malfunction">Malfunction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Bin ID</label>
              <Select value={binIdFilter} onValueChange={setBinIdFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Bins" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bins</SelectItem>
                  {uniqueBinIds.map(binId => (
                    <SelectItem key={binId} value={binId}>{binId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bin History Records ({filteredHistory.length} records)</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchBinHistory}>Retry</Button>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bin history records found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bin ID</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Weight (kg)</TableHead>
                      <TableHead>Distance (cm)</TableHead>
                      <TableHead>Bin Level (%)</TableHead>
                      <TableHead>GPS Coordinates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((record) => {
                      const { date, time } = formatTimestamp(record.timestamp);
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.binId}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm">{date}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {time}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{record.weight.toFixed(2)}</TableCell>
                          <TableCell>{record.distance.toFixed(1)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    record.binLevel >= 85 ? 'bg-red-500' : 
                                    record.binLevel >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(record.binLevel, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{record.binLevel.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-xs font-mono">
                                {record.gpsValid ? formatCoordinates(record.gps) : 'Invalid GPS'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell>
                            {record.errorMessage ? (
                              <span className="text-red-600 text-sm">{record.errorMessage}</span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length} records
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
