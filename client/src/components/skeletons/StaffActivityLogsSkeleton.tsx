import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StaffActivityLogsSkeleton() {
  return (
    <>
      {/* Filter Skeletons */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </div>

      <div className="mt-4">
        {/* Table Header */}
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full border-collapse">
            <thead>
              <tr>
                {[...Array(9)].map((_, i) => (
                  <th key={i} className="px-4 py-2 text-left">
                    <Skeleton className="h-4 w-24 rounded-md" />
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody>
              {[...Array(6)].map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-gray-100 dark:border-gray-700">
                  {[...Array(9)].map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[120px] rounded-md" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View Skeletons */}
        <div className="lg:hidden mt-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex justify-between mb-3">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
              <Skeleton className="h-5 w-3/4 mb-2 rounded-md" />
              <Skeleton className="h-4 w-1/2 mb-2 rounded-md" />
              <Skeleton className="h-4 w-1/3 rounded-md" />
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
