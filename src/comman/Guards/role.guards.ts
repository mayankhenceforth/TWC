import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { Role } from "../enums/role.enum";
import { ROLES_KEY } from "../decorator/role.decorator";

@Injectable()

export class RoleGuards implements CanActivate {

    constructor(private reflector: Reflector) { }
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requireRole = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ])

        if (!requireRole) return true

        const { user } = context.switchToHttp().getRequest();
        return requireRole.includes(user?.role)
    }
}