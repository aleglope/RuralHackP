import React from "react";

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="container flex h-14 max-w-screen-2xl items-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Equilátero DSC
      </div>
    </footer>
  );
};

export default Footer;
