import { Application } from '../declarations';
import profiles from './profiles/profiles.service';
import users from './users/users.service';
import me from './me/me.service';

export default function (app: Application): void {
    app.configure(users);
    app.configure(profiles);
    app.configure(me);
}
