import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';


const routes: Routes = [
  { path:'',component:LoginComponent },
  { path: 'admin',canActivate:[AuthGuard], loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) },
   { path: 'driver',canActivate:[AuthGuard], loadChildren: () => import('./driver/driver.module').then(m => m.DriverModule) },
   {
    path: '**',
    redirectTo: ''
  }
  ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
