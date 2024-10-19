import React from "react";
import { FaGithub } from "react-icons/fa";
import { FaLinkedinIn } from "react-icons/fa6";
import { FaGooglePlusG } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div className=" relative pt-10">
      <footer className="bg-red-900 absolute bottom-0 w-full text-white h-12 px-4 md:px-12 text-center flex flex-row items-center justify-between">
        <p className="font-semibold text-sm md:text-base">AgroConnect</p>
        <div className="flex flex-row text-lg md:text-2xl gap-3 md:gap-5">
          <a href={"https://github.com/Om21610018"} target="_blank">
            <FaGithub />
          </a>
          <a
            href={"https://www.linkedin.com/in/omkar-penshanwar-537373233/"}
            target="_blank"
          >
            <FaLinkedinIn />
          </a>
          <a href={"/"}>
            <FaGooglePlusG />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
