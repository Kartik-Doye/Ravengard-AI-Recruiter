import React from 'react';
import { GatewayHero } from '../components/gateway/GatewayHero';
import { GatewayActions } from '../components/gateway/GatewayActions';
import { GatewayTrustStrip } from '../components/gateway/GatewayTrustStrip';

export default function Gateway() {
  return (
    <div className="flex flex-col min-h-screen">
      <GatewayHero />
      <GatewayActions />
      <GatewayTrustStrip />
    </div>
  );
}
