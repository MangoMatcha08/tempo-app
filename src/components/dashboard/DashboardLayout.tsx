
import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "./DashboardSidebar";
import { useBreakpointDown } from "@/hooks/use-media-query";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useBreakpointDown("md");

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-screen w-full overflow-hidden">
        <DashboardSidebar />
        
        <SidebarInset className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <div className="container mx-auto px-2 sm:px-4 py-6 max-w-5xl relative">
              {isMobile && (
                <div className="absolute top-2 left-2 z-10">
                  <SidebarTrigger className="bg-background shadow-sm" />
                </div>
              )}
              <div className={isMobile ? "pt-8" : ""}>
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
