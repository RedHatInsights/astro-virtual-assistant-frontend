import { BrowserRouter } from 'react-router-dom';
import AstroVirtualAssistant from '../../src/v2/SharedComponents/AstroVirtualAssistant/AstroVirtualAssistant';
import { ScalprumProvider } from '@scalprum/react-core';

const AstroVirtualAssistantTest = () => {
    return (
        <ScalprumProvider
            config={{ foo: { name: 'foo' } }}
            api={{ 
                chrome: { 
                    addWsEventListener: () => () => {}, 
                    auth: {
                        getUser: () => Promise.resolve({ identity: { user: { is_org_admin: true }} }), 
                    },
                    isBeta: () => false,
                    useChrome: {
                        isBeta: () => false,
                    }
                }
            }}
        >
            <BrowserRouter>
                <AstroVirtualAssistant />
            </BrowserRouter>
        </ScalprumProvider>
    )
}

describe('AstroVirtualAssistant', () => {
    it('renders the Astro Virtual Assistant', () => {
        cy.mount(<AstroVirtualAssistantTest />);
        cy.get('.virtualAssistant').should('exist');
        cy.get('[data-layer="Content"]').click().should('have.class', 'pf-v5-c-chat__message--user');
    });
})
