package com.rental.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Clean URLs for the multi-page frontend.
 *
 * The UI is a set of plain static HTML files under /static, one per screen.
 * This controller forwards extension-less paths ("/cars") to the matching file
 * ("/cars.html") so the address bar stays tidy and links keep working whether
 * the user types /login or /login.html.
 *
 * These are forwards, not redirects — the browser URL does not change, and the
 * static resource handler serves the file as usual. No view template engine and
 * no server-side rendering is involved: each page still fetches its data from
 * the REST API with the JWT held by the browser.
 */
@Controller
public class PageController {

    /**
     * The root URL is the sign-in page. There is no public landing page: a
     * visitor who is not signed in has nothing to do here but log in, and
     * login.js bounces an already-signed-in user straight to their own home.
     */
    @GetMapping("/")
    public String home() { return "forward:/login.html"; }

    @GetMapping("/login")
    public String login() { return "forward:/login.html"; }

    @GetMapping("/register")
    public String register() { return "forward:/register.html"; }

    @GetMapping("/cars")
    public String cars() { return "forward:/cars.html"; }

    @GetMapping("/bookings")
    public String bookings() { return "forward:/bookings.html"; }

    @GetMapping("/assistant")
    public String assistant() { return "forward:/assistant.html"; }

    @GetMapping("/support")
    public String support() { return "forward:/support.html"; }

    @GetMapping("/settings")
    public String settings() { return "forward:/settings.html"; }

    // Admin URLs are deliberately flat ("/admin-fleet", not "/admin/fleet").
    // A nested path would make the browser resolve the pages' relative asset
    // links against "/admin/", breaking every script and stylesheet reference.
    @GetMapping("/admin")
    public String admin() { return "forward:/admin-dashboard.html"; }

    @GetMapping("/admin-dashboard")
    public String adminDashboard() { return "forward:/admin-dashboard.html"; }

    @GetMapping("/admin-fleet")
    public String adminFleet() { return "forward:/admin-fleet.html"; }

    @GetMapping("/admin-bookings")
    public String adminBookings() { return "forward:/admin-bookings.html"; }

    @GetMapping("/admin-customers")
    public String adminCustomers() { return "forward:/admin-customers.html"; }
}
