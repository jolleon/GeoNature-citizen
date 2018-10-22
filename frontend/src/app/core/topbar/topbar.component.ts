import { AuthService } from './../../auth/auth.service';
import { Component, OnInit } from "@angular/core";
import { AppConfig } from "../../../conf/app.config";
import { stringify } from "@angular/core/src/util";

@Component({
  selector: "app-topbar",
  templateUrl: "./topbar.component.html",
  styleUrls: ["./topbar.component.css"]
})
export class TopbarComponent implements OnInit {
  title: string = AppConfig.appName;
  isLoggedIn: boolean = false;
  username: string = "not defined";
  
  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    const access_token = localStorage.getItem("access_token");
    if (access_token) {
      this.auth
        .ensureAuthenticated(access_token)
        .then(user => {
          console.log("LoggerUser Get Status", user.status);
          if (user.status == "200") {
            this.isLoggedIn = true;
            this.username = user.json().username;
          }
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
}
