import { ReactComponent as ForumIcon } from "../../assets/icons/forum.svg";
import { ReactComponent as GovIcon } from "../../assets/icons/governance.svg";
import { ReactComponent as DocsIcon } from "../../assets/icons/docs.svg";
import { ReactComponent as SpookySwapIcon } from "../../assets/icons/spookyswap.svg";
import { ReactComponent as SpiritSwapIcon } from "../../assets/icons/spiritswap.svg";
import { ReactComponent as FeedbackIcon } from "../../assets/icons/feedback.svg";
import { SvgIcon } from "@material-ui/core";
import { AccountBalanceOutlined, MonetizationOnOutlined } from "@material-ui/icons";

const externalUrls = [
  // {
  //   title: "Forum",
  //   url: "https://forum.app.hectordao.com/",
  //   icon: <SvgIcon color="primary" component={ForumIcon} />,
  // },
  // {
  //   title: "Governance",
  //   url: "https://vote.app.hectordao.com/",
  //   icon: <SvgIcon color="primary" component={GovIcon} />,
  // },
  {
    title: "Buy",
    url: "https://pancakeswap.finance/swap?inputCurrency=0xe9e7cea3dedca5984780bafc599bd69add087d56&outputCurrency=0x5AaE9fB9F6c49fEa7c4F8d4Ba8f092bFb60671D0",
    icon: <SvgIcon viewBox="0 0 64 64" color="primary" component={SpookySwapIcon} />,
  },
  // {
  //   title: "Buy on Wayland.finance",
  //   url: "https://swap.spiritswap.finance/#/exchange/swap/0x5c4fdfc5233f935f20d2adba572f770c2e377ab0",
  //   icon: <SvgIcon viewBox="0 0 250 250" color="primary" component={SpiritSwapIcon} />,
  // },
  // {
  //   title: "MNT Lend",
  //   label: "(Coming soon)",
  //   icon: <MonetizationOnOutlined viewBox="0 0 20 24" />,
  // },
  // {
  //   title: "MNT Borrow",
  //   label: "(Coming soon)",
  //   icon: <MonetizationOnOutlined viewBox="0 0 20 24" />,
  // },
  // {
  //   title: "MNT PRO",
  //   label: "(Coming soon)",
  //   icon: <AccountBalanceOutlined viewBox="0 0 20 24" />,
  // },
  // {
  //   title: "Governance",
  //   url: "https://snapshot.org/#/hectordao.eth",
  //   icon: <SvgIcon color="primary" component={GovIcon} />,
  // },
  {
    title: "Docs",
    url: "https://docs.paladindao.com/",
    icon: <SvgIcon color="primary" component={DocsIcon} />,
  },
  // {
  //   title: "Feedback",
  //   url: "https://olympusdao.canny.io/",
  //   icon: <SvgIcon color="primary" component={FeedbackIcon} />,
  // },
];

export default externalUrls;
