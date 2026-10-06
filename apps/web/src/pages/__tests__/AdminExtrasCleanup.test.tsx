import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import AdminExtrasPage from '../AdminExtrasPage';
vi.mock('../../hooks/useAdminRole',()=>({useAdminRole:()=>({isAdmin:true})}));
vi.mock('../../components/admin/AdminFullAccess',()=>({default:()=> <div>Secure Full Access tools</div>}));
vi.mock('../../components/admin/AdminUserManagement',()=>({default:()=> <div>Secure role tools</div>}));
afterEach(cleanup);
it.each([true,false])('retired generation controls are absent; secure support tools remain (mobile=%s)',mobile=>{
 render(<AdminExtrasPage isMobile={mobile}/>);
 expect(screen.queryByText(/Insights & Easter Eggs|Generate Insights|Bulk Ingestion|Auto Content|Marquee Comments|Video Submissions|Approve All|Reject All/i)).not.toBeInTheDocument();
 if(mobile){fireEvent.change(screen.getByRole('combobox'),{target:{value:'access'}});}else{fireEvent.click(screen.getByRole('button',{name:'Full Access grants'}));}
 expect(screen.getByText('Secure Full Access tools')).toBeInTheDocument();
 if(mobile){fireEvent.change(screen.getByRole('combobox'),{target:{value:'roles'}});}else{fireEvent.click(screen.getByRole('button',{name:'Manage Admin Roles'}));}
 expect(screen.getByText('Secure role tools')).toBeInTheDocument();
});
