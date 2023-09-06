import { Callout, Link } from "nextra-theme-docs";
import { WeChatIcon } from "./icons/WeChat";

export function Preamble() {
  return (
    <Callout type="info">
      <div>
        文章作者: <Link href="https://twitter.com/BoxMrChen">@BoxMrChen</Link>
        ，欢迎转载，转载请注明出处。
      </div>
      <div>
        文章 Github 仓库:{" "}
        <Link href="https://github.com/nishuzumi/blog">
          https://github.com/nishuzumi/blog
        </Link>
        欢迎Star。如果文章有误，欢迎提PR。
      </div>
      <div>
        进入交流群：欢迎添加个人微信{" "}
        <span className="text-green-600">
          <WeChatIcon className="inline-block" /> <code>Im3boxtech</code>
        </span>
        ，备注`进群`，我会拉你进入交流群。
      </div>
    </Callout>
  );
}
