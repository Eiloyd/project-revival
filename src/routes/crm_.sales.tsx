import { createFileRoute } from '@tanstack/react-router';
import { CrmWorkspace } from '@/components/crm/workspace';

function CrmSales(){return <CrmWorkspace initialView="collections"/>;}

export const Route=createFileRoute('/crm_/sales')({
 staticData:{sitemap:false},
 head:()=>({meta:[{title:'RILOYD CRM | Sales Collections & Daily Wage'},{name:'description',content:'BDE/BDM sales view: direct vs volunteer-sourced collection, target progress and the remove-your-zero reminder.'},{property:'og:title',content:'RILOYD CRM | Sales Collections & Daily Wage'},{property:'og:description',content:'Direct and volunteer-sourced collection, targets and daily wage for the sales team.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]}),
 component:CrmSales,
});
