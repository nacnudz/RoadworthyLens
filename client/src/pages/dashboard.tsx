import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { CHECKLIST_ITEMS } from "@shared/schema";

interface Inspection {
  id: string;
  roadworthyNumber: string;
  clientName: string;
  vehicleDescription: string;
  status: string;
  checklistItems: Record<string, boolean>;
  photos: Record<string, string[]>;
  completedAt?: string;
  updatedAt: string;
}

export default function Dashboard() {
  const isMobile = useIsMobile();

  const { data: inProgressInspections = [], isLoading: loadingInProgress } = useQuery<Inspection[]>({
    queryKey: ["/api/inspections/in-progress"],
  });

  const { data: completedInspections = [], isLoading: loadingCompleted } = useQuery<Inspection[]>({
    queryKey: ["/api/inspections/completed"],
  });

  const getProgressInfo = (inspection: Inspection) => {
    const completed = Object.values(inspection.checklistItems || {}).filter(Boolean).length;
    const total = CHECKLIST_ITEMS.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return <Badge className="bg-secondary/10 text-secondary">Pass</Badge>;
      case "fail":
        return <Badge className="bg-destructive/10 text-destructive">Fail</Badge>;
      default:
        return <Badge className="bg-accent/10 text-accent">In Progress</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Less than 1 hour ago";
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  if (loadingInProgress || loadingCompleted) {
    return (
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const completedToday = completedInspections.filter(inspection => {
    const completedDate = new Date(inspection.completedAt || inspection.updatedAt);
    const today = new Date();
    return completedDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="p-4 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="text-2xl font-medium text-accent">{inProgressInspections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Completed Today</div>
            <div className="text-2xl font-medium text-secondary">{completedToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* In Progress Inspections */}
      <section>
        <h2 className="text-lg font-medium mb-3 text-on-surface">In Progress</h2>
        {inProgressInspections.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No inspections in progress
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {inProgressInspections.map((inspection) => {
              const { completed, total, percentage } = getProgressInfo(inspection);
              return (
                <Card key={inspection.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-on-surface">{inspection.roadworthyNumber}</h3>
                        <p className="text-sm text-gray-600">{inspection.clientName}</p>
                        <p className="text-xs text-gray-500">{inspection.vehicleDescription}</p>
                      </div>
                      {getStatusBadge(inspection.status)}
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1">
                        {completed} of {total} items completed
                      </div>
                    </div>
                    
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary-dark">
                      Continue Inspection
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed Inspections */}
      <section>
        <h2 className="text-lg font-medium mb-3 text-on-surface">Recent Completed</h2>
        {completedInspections.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No completed inspections
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {completedInspections.slice(0, 5).map((inspection) => (
              <Card key={inspection.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-on-surface">{inspection.roadworthyNumber}</h3>
                      <p className="text-sm text-gray-600">{inspection.clientName}</p>
                      <p className="text-xs text-gray-500">{inspection.vehicleDescription}</p>
                      <p className="text-xs text-gray-400">
                        {inspection.completedAt ? `Completed ${formatTimeAgo(inspection.completedAt)}` : `Updated ${formatTimeAgo(inspection.updatedAt)}`}
                      </p>
                    </div>
                    {getStatusBadge(inspection.status)}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="secondary" className="flex-1">
                      View Report
                    </Button>
                    <Button className="flex-1 bg-primary hover:bg-primary-dark">
                      Retest
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
