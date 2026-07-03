import networkx as nx

def build_synthetic_network() -> nx.DiGraph:
    """
    Builds the Green Finance Siphoning Network scenario:
    HSBC -> Gaurav (borrower) -> Bharat/Anup (mules) -> shell/exclusion entity
    Bharat -> Partha (UBO, closes the loop)
    """
    G = nx.DiGraph()

    # Step 1: Primary borrower + green loan disbursement
    G.add_node(
        "Gaurav_Sustainable_Corp",
        type="Corporate",
        kyc_status="Clean",
        project="Sustainable Water Management",
    )
    G.add_node("HSBC_Green_Asset_Register", type="Internal_Account")
    G.add_edge(
        "HSBC_Green_Asset_Register",
        "Gaurav_Sustainable_Corp",
        amount=10_000_000,
        relation="GREEN_LOAN_DISBURSEMENT",
    )

    # Step 2: Shell company linkages / gatekeeper (shared address)
    shared_address = "78 Synthetic Shell Ave, London"
    subcontractors = ["Bharat_Logistics_MSME", "Anup_Consulting_MSME"]

    for sub in subcontractors:
        G.add_node(
            sub,
            type="MSME",
            registered_address=shared_address,
            kyc_history="None",
        )
        G.add_edge(
            "Gaurav_Sustainable_Corp",
            sub,
            amount=3_000_000,
            relation="VENDOR_PAYMENT",
        )

    # Step 3: Exposure to excluded entity (greenwashing / emissions violation)
    G.add_node(
        "Entity_High_Carbon",
        type="Corporate",
        watchlist_hit="Framework_Exclusion",
        emission_gCO2_kWh=150,
    )
    G.add_edge(
        "Anup_Consulting_MSME",
        "Entity_High_Carbon",
        amount=2_800_000,
        relation="SUPPLY_CHAIN_PAYMENT",
    )

    # Step 4: Circular fund flow back to the UBO (Partha)
    G.add_node("Partha_UBO", type="Individual", role="Director")
    G.add_edge(
        "Bharat_Logistics_MSME",
        "Partha_UBO",
        amount=2_500_000,
        relation="CONSULTING_FEE",
    )
    # Closes the loop: Partha controls Gaurav's corp
    G.add_edge(
        "Partha_UBO",
        "Gaurav_Sustainable_Corp",
        amount=0,
        relation="DIRECTOR_OF",
    )

    return G


if __name__ == "__main__":
    G = build_synthetic_network()
    print(f"Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}")
    print("Node list:", list(G.nodes(data=True)))