import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import CreateNewChat from "../chat/CreateNewChat";
import StoryTray from "../chat/StoryTray";
import ConversationList from "../chat/ConversationList";
import { useAuthStore } from "@/stores/useAuthStore";
import ConversationSkeleton from "../skeleton/ConversationSkeleton";
import { useChatStore } from "@/stores/useChatStore";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  const { convoLoading } = useChatStore();

  return (
    <Sidebar variant="inset" {...props}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="bg-gradient-primary"
            >
              <a href="#">
                <div className="flex w-full items-center px-2">
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <img src="/favicon.svg" alt="Logo" className="w-7 h-7" />
                    NexusChat
                  </h1>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="overflow-hidden flex flex-col min-h-0 p-0 gap-0">
        {/* 1. Search & Quick Actions (Fixed Top) */}
        <SidebarGroup className="p-2 pb-1 shrink-0">
          <SidebarGroupContent>
            <CreateNewChat />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 2. Story / Status Notes Bar (Fixed Top, Horizontal Only) */}
        <SidebarGroup className="px-2 py-0 shrink-0 border-b border-border/50">
          <SidebarGroupContent>
            <StoryTray />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 3. 3 Tabs (All, Bạn bè, Nhóm) & Unified Conversation List (Independent Scroll) */}
        <SidebarGroup className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          <SidebarGroupContent className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {convoLoading ? <ConversationSkeleton /> : <ConversationList />}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
