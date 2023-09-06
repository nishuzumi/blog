import React from "react";
import { DocsThemeConfig, Link } from "nextra-theme-docs";
import { Preamble } from "components/preamble";

const config: DocsThemeConfig = {
  logo: <span>ByteMahou</span>,
  project: {
    link: "https://github.com/nishuzumi/blog",
  },
  chat: {
    link: "https://t.me/BoxMrChen",
  },
  docsRepositoryBase: "https://github.com/nishuzumi/blog",
  footer: {
    text: (
      <div className="flex w-full flex-col">
        <div className="flex w-full">
          <span>简约的字节魔法</span>
        </div>
        <div className="flex w-full justify-center">
          <span>
            Made by <Link href="https://twitter.com/BoxMrChen">Box</Link> With
            ❤️
          </span>
        </div>
      </div>
    ),
  },
  useNextSeoProps() {
    return {
      titleTemplate: "%s - ByteMahou",
    };
  },
  editLink: {
    text: "修正此文章",
  },
  feedback: {
    content: "有疑问？请在此提出你的问题。",
  },
  components: {
    Preamble,
  },
  toc: {
    title: "目录",
  },
};

export default config;
