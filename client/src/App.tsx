import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Champions from "@/pages/Champions";
import UnderAchievers from "@/pages/UnderAchievers";
import ProductiveHours from "@/pages/ProductiveHours";
import Tracking from "@/pages/Tracking";
import DataUpload from "@/pages/DataUpload";
import Roster from "@/pages/Roster";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/champions" component={Champions} />
        <Route path="/under-achievers" component={UnderAchievers} />
        <Route path="/productive-hours" component={ProductiveHours} />
        <Route path="/tracking" component={Tracking} />
        <Route path="/data-upload" component={DataUpload} />
        <Route path="/roster" component={Roster} />
        <Route path="/login" component={Login} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
