import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import '@umijs/max';
import React from 'react';

const Footer: React.FC = () => {
  const defaultMessage = 'Octaver';
  const currentYear = new Date().getFullYear();
  return (
    <DefaultFooter
      style={{
        background: 'none',
        marginTop: '-60px', // 减小与上方内容的间距
      }}
      copyright={`${currentYear} ${defaultMessage}`}
      links={[
        {
          key: 'tutor',
          title: '鱼皮',
          href: 'https://github.com/liyupi',
          blankTarget: true,
        },
        {
          key: 'github',
          title: (
            <>
              <GithubOutlined /> 咕噜咕噜
            </>
          ),
          href: 'https://github.com/Octaver2131',
          blankTarget: true,
        },
        {
          key: 'author',
          title: '欧可',
          href: 'https://github.com/Octaver2131',
          blankTarget: true,
        },
      ]}
    />
  );
};
export default Footer;
