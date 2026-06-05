/**
 * 中文职责说明：布局公共出口只转发组件和从 route registry 派生的导航 meta。
 */
export { AppSidebar, SIDEBAR_COLLAPSED_WIDTH_PX, SIDEBAR_EXPANDED_WIDTH_PX } from '@/components/layout/sidebar';
export { PageStage } from '@/components/layout/page-stage';
export { getVisibleRouteMeta as appNavItems } from '@/routes/registry/route-meta';
