<template>
  <div>
    <a-page-header :title="`租赁详情 ${rental?.rentalNumber || ''}`" @back="$router.back()" />

    <a-card v-if="rental" class="rental-detail-card" :loading="loading" :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <a-descriptions v-if="!isMobile" bordered :column="3">
        <a-descriptions-item label="状态">
          <a-tag :color="rentalDisplayStatusColor(rental)">{{ rentalDisplayStatusText(rental) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="租客">
          <RenterLink :renter-id="rental.renterId" :name="rental.renter?.name" />
        </a-descriptions-item>
        <a-descriptions-item label="负责人">{{ rental.assignedTo || '-' }}</a-descriptions-item>
        <a-descriptions-item label="预计发货">{{ formatDate(rental.expectedShipDate) }}</a-descriptions-item>
        <a-descriptions-item label="开始日期">{{ formatDate(rental.startDate) }}</a-descriptions-item>
        <a-descriptions-item label="预计结束">{{ formatDate(rental.expectedEndDate) }}</a-descriptions-item>
        <a-descriptions-item label="续租意愿">
          <a-tag :color="rental.hasRenewalIntent ? 'blue' : 'default'">
            {{ rental.hasRenewalIntent && rental.renewalIntentEndDate ? `是，至 ${formatDate(rental.renewalIntentEndDate)}` : '否' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="实际结束">{{ formatDate(rental.actualEndDate) || '-' }}</a-descriptions-item>
        <a-descriptions-item label="总价">{{ formatMoney(rental.totalPrice) }}</a-descriptions-item>
        <a-descriptions-item label="押金">{{ formatMoney(rental.deposit) || '-' }}</a-descriptions-item>
        <a-descriptions-item label="运费合计">{{ formatMoney(rental.totalShippingFee) }}</a-descriptions-item>
        <a-descriptions-item label="其他费用">{{ formatMoney(rental.otherFee) }}</a-descriptions-item>
        <a-descriptions-item label="核算金额">{{ formatMoney(rental.accountedAmount) }}</a-descriptions-item>
        <a-descriptions-item label="日均核算">{{ formatMoney(dailyAccountedAmount) }}</a-descriptions-item>
        <a-descriptions-item label="平台订单号">{{ rental.platformOrderNo || '-' }}</a-descriptions-item>
        <a-descriptions-item v-if="rental.renewedFromRentalId" label="续租自">
          <router-link :to="`/rentals/${rental.renewedFromRentalId}`">{{ rental.renewedFromRentalNumber }}</router-link>
        </a-descriptions-item>
        <a-descriptions-item v-if="rental.renewedToRentalId" label="续租到">
          <router-link :to="`/rentals/${rental.renewedToRentalId}`">{{ rental.renewedToRentalNumber }}</router-link>
        </a-descriptions-item>
        <a-descriptions-item label="收货地址" :span="isMobile ? 1 : 3">{{ rental.shippingAddress || '-' }}</a-descriptions-item>
        <a-descriptions-item label="备注" :span="isMobile ? 1 : 3">{{ rental.notes || '-' }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDateTime(rental.createdAt) || '-' }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ formatDateTime(rental.updatedAt) || '-' }}</a-descriptions-item>
        <a-descriptions-item label="创建人">{{ rental.createdBy || '-' }}</a-descriptions-item>
        <a-descriptions-item label="发货人">{{ rental.senderName || '-' }}</a-descriptions-item>
      </a-descriptions>

      <div v-if="isMobile" class="rental-mobile-shell">
        <section class="rental-mobile-hero">
          <div class="rental-mobile-hero-top">
            <span class="rental-mobile-number">{{ rental.rentalNumber }}</span>
            <a-tag class="rental-mobile-status" :color="rentalDisplayStatusColor(rental)">
              {{ rentalDisplayStatusText(rental) }}
            </a-tag>
          </div>
          <div class="rental-mobile-renter">
            <RenterLink :renter-id="rental.renterId" :name="rental.renter?.name" />
          </div>
          <div class="rental-mobile-period">
            {{ formatDate(rental.startDate) || '-' }} 至 {{ formatDate(rental.expectedEndDate) || '-' }}
          </div>
          <div class="rental-mobile-hero-meta">
            <span>负责人：{{ rental.assignedTo || '-' }}</span>
            <span>预计发货：{{ formatDate(rental.expectedShipDate) || '-' }}</span>
          </div>
        </section>

        <div class="rental-mobile-money-grid">
          <div class="rental-mobile-money-card primary">
            <span>总价</span>
            <strong>{{ formatMoney(rental.totalPrice) || '-' }}</strong>
          </div>
          <div class="rental-mobile-money-card">
            <span>核算金额</span>
            <strong>{{ formatMoney(rental.accountedAmount) || '-' }}</strong>
          </div>
          <div class="rental-mobile-money-card">
            <span>日均核算</span>
            <strong>{{ formatMoney(dailyAccountedAmount) || '-' }}</strong>
          </div>
        </div>

        <section class="rental-mobile-info-section">
          <div class="rental-mobile-section-title">租期与发货</div>
          <div class="rental-mobile-key-values">
            <div><span>开始日期</span><strong>{{ formatDate(rental.startDate) || '-' }}</strong></div>
            <div><span>预计结束</span><strong>{{ formatDate(rental.expectedEndDate) || '-' }}</strong></div>
            <div><span>预计发货</span><strong>{{ formatDate(rental.expectedShipDate) || '-' }}</strong></div>
            <div>
              <span>续租意愿</span>
              <strong>{{ rental.hasRenewalIntent && rental.renewalIntentEndDate ? `是，至 ${formatDate(rental.renewalIntentEndDate)}` : '否' }}</strong>
            </div>
            <div><span>实际结束</span><strong>{{ formatDate(rental.actualEndDate) || '-' }}</strong></div>
            <div v-if="rental.renewedFromRentalId">
              <span>续租自</span>
              <strong>
                <router-link :to="`/rentals/${rental.renewedFromRentalId}`">{{ rental.renewedFromRentalNumber }}</router-link>
              </strong>
            </div>
            <div v-if="rental.renewedToRentalId">
              <span>续租到</span>
              <strong>
                <router-link :to="`/rentals/${rental.renewedToRentalId}`">{{ rental.renewedToRentalNumber }}</router-link>
              </strong>
            </div>
          </div>
        </section>

        <section class="rental-mobile-info-section">
          <div class="rental-mobile-section-title">金额与订单</div>
          <div class="rental-mobile-key-values">
            <div><span>押金</span><strong>{{ formatMoney(rental.deposit) || '-' }}</strong></div>
            <div><span>运费合计</span><strong>{{ formatMoney(rental.totalShippingFee) || '-' }}</strong></div>
            <div><span>其他费用</span><strong>{{ formatMoney(rental.otherFee) || '-' }}</strong></div>
            <div><span>平台订单号</span><strong>{{ rental.platformOrderNo || '-' }}</strong></div>
          </div>
        </section>

        <section class="rental-mobile-info-section">
          <div class="rental-mobile-section-title">收货与备注</div>
          <div class="rental-mobile-key-values">
            <div class="full"><span>收货地址</span><strong>{{ rental.shippingAddress || '-' }}</strong></div>
            <div class="full"><span>备注</span><strong>{{ rental.notes || '-' }}</strong></div>
            <div><span>创建人</span><strong>{{ rental.createdBy || '-' }}</strong></div>
            <div><span>发货人</span><strong>{{ rental.senderName || '-' }}</strong></div>
            <div><span>创建时间</span><strong>{{ formatDateTime(rental.createdAt) || '-' }}</strong></div>
            <div><span>更新时间</span><strong>{{ formatDateTime(rental.updatedAt) || '-' }}</strong></div>
          </div>
        </section>
      </div>

      <a-divider />

      <div v-if="isMobile" class="rental-mobile-actions">
        <div class="rental-primary-actions">
          <a-button v-if="canShip" type="primary" @click="openOutbound">登记发货</a-button>
          <a-tooltip :title="receiveDisabledReason" :open="canReceive ? false : undefined">
            <a-button :disabled="!canReceive" @click="openInbound">登记回货物流</a-button>
          </a-tooltip>
          <a-tooltip :title="returnDisabledReason" :open="canReturn ? false : undefined">
            <a-button :disabled="!canReturn" @click="returnVisible = true">登记归还</a-button>
          </a-tooltip>
        </div>
        <div class="rental-secondary-actions">
          <a-button v-if="canEdit" @click="openEdit">编辑基础信息</a-button>
          <a-button v-if="canRenew" type="primary" ghost @click="openRenew">续租</a-button>
          <a-button v-if="canCancel" danger @click="cancelVisible = true">取消租赁</a-button>
        </div>
      </div>

      <div v-else class="rental-actions">
        <a-button v-if="canEdit" @click="openEdit">编辑基础信息</a-button>
        <a-button v-if="canRenew" type="primary" ghost @click="openRenew">续租</a-button>
        <a-button v-if="canShip" type="primary" @click="openOutbound">登记发货</a-button>
        <a-tooltip :title="receiveDisabledReason" :open="canReceive ? false : undefined">
          <a-button :disabled="!canReceive" @click="openInbound">登记回货物流</a-button>
        </a-tooltip>
        <a-tooltip :title="returnDisabledReason" :open="canReturn ? false : undefined">
          <a-button :disabled="!canReturn" @click="returnVisible = true">登记归还</a-button>
        </a-tooltip>
        <a-button v-if="canCancel" danger @click="cancelVisible = true">取消租赁</a-button>
      </div>

      <template v-if="canShowSettlementPanel">
        <a-divider>结算信息</a-divider>
        <a-spin :spinning="settlementLoading">
          <div class="settlement-section">
            <a-alert
              v-if="settlementInfo?.ineligibleReason"
              type="warning"
              show-icon
              :message="settlementInfo.ineligibleReason"
            />
            <a-alert
              v-if="isRenewedSettlement && canShowSettlementDetails"
              type="info"
              show-icon
              message="该结算只覆盖当前租赁单，续租后的费用请到续租单结算。"
            />
<!--
            <div v-if="canShowSettlementDetails" class="settlement-header">
              <a-space wrap>
                <a-tag v-if="settlementInfo?.settlementNotifiedAt" color="green">
                  已发送 {{ formatDateTime(settlementInfo.settlementNotifiedAt) }}
                </a-tag>
                <a-tag v-else color="default">未发送</a-tag>
                <a-button
                  type="primary"
                  :loading="settlementSending"
                  :disabled="!canSendSettlement"
                  @click="confirmSendSettlement"
                >
                  {{ settlementInfo?.settlementNotifiedAt ? '重新发送结算信息' : '发送结算信息' }}
                </a-button>
              </a-space>
            </div>
-->
            <a-descriptions v-if="settlementInfo && canShowSettlementDetails" bordered :column="isMobile ? 1 : 4" :size="isMobile ? 'small' : 'default'">
              <a-descriptions-item label="总价">{{ formatMoney(settlementInfo.totalPrice) }}</a-descriptions-item>
              <a-descriptions-item label="核算">{{ formatMoney(settlementInfo.accountedAmount) }}</a-descriptions-item>
              <a-descriptions-item label="技术">
                {{ formatMoney(settlementInfo.technicianAmount) }} / {{ settlementInfo.technicianPercent }}%
              </a-descriptions-item>
              <a-descriptions-item label="建单">
                {{ creatorSettlementLabel }} {{ formatMoney(settlementInfo.creatorAmount) }} / {{ settlementInfo.creatorPercent }}%
              </a-descriptions-item>
              <a-descriptions-item label="发货人">
                {{ formatMoney(settlementInfo.shipperAmount) }} / {{ settlementInfo.shipperPercent }}%
              </a-descriptions-item>
              <a-descriptions-item label="物品所有" :span="isMobile ? 1 : 2">
                {{ formatMoney(settlementInfo.itemOwnerAmount) }} / {{ settlementInfo.itemOwnerPercent }}%
              </a-descriptions-item>
              <a-descriptions-item label="发货分账" :span="isMobile ? 1 : 2">
                <template v-if="settlementInfo.shipperShares.length">
                  <a-space wrap>
                    <a-tag v-for="share in settlementInfo.shipperShares" :key="`${share.shipperName || 'none'}-${share.amount}`">
                      {{ settlementShipperShareLabel(share) }} {{ formatMoney(share.amount) }}
                    </a-tag>
                  </a-space>
                </template>
                <span v-else>-</span>
              </a-descriptions-item>
              <a-descriptions-item label="物品分账" :span="isMobile ? 1 : 2">
                <template v-if="settlementInfo.ownerShares.length">
                  <a-space wrap>
                    <a-tag v-for="(share, index) in settlementInfo.ownerShares" :key="`${index}-${share.ownerName || 'none'}-${share.itemShortId || share.itemName || 'item'}-${share.amount}`">
                      {{ settlementShareLabel(share) }} {{ formatMoney(share.amount) }}
                    </a-tag>
                  </a-space>
                </template>
                <span v-else>-</span>
              </a-descriptions-item>
            </a-descriptions>

            <pre v-if="settlementPreviewText && canShowSettlementDetails" class="settlement-preview">{{ settlementPreviewText }}</pre>
          </div>
        </a-spin>
      </template>
      <template v-else-if="showActiveRenewalSettlementNotice">
        <a-divider>结算信息</a-divider>
        <a-alert
          type="info"
          show-icon
          message="续租单进行中，结束或再次续租后生成结算信息。"
        />
      </template>

      <a-divider>租赁商品</a-divider>

      <div v-if="isMobile" class="rental-mobile-toolbar">
        <a-button v-if="canEdit" block type="primary" ghost @click="openItemPicker">修改租赁物品</a-button>
        <a-button block @click="exportItemsXlsx">导出 xlsx</a-button>
        <a-upload class="rental-mobile-upload" :before-upload="importItemsXlsx" :show-upload-list="false" accept=".xlsx,.xls">
          <a-button block :loading="importing">导入 xlsx</a-button>
        </a-upload>
        <a-button block type="link" @click="downloadItemsTemplate">下载模板</a-button>
      </div>

      <a-space v-else style="margin-bottom: 12px" wrap>
        <a-button v-if="canEdit" :block="isMobile" type="primary" ghost @click="openItemPicker">修改租赁物品</a-button>
        <a-button :block="isMobile" @click="exportItemsXlsx">导出 xlsx</a-button>
        <a-upload :before-upload="importItemsXlsx" :show-upload-list="false" accept=".xlsx,.xls">
          <a-button :block="isMobile" :loading="importing">导入 xlsx</a-button>
        </a-upload>
        <a-button :block="isMobile" type="link" @click="downloadItemsTemplate">下载模板</a-button>
      </a-space>

      <div v-if="rentalItemCategoryGroups.length" :class="['rental-item-category-list', { mobile: isMobile }]">
        <section
          v-for="(group, groupIndex) in rentalItemCategoryGroups"
          :key="group.key"
          class="rental-item-category-section"
          :style="categoryGroupStyle(groupIndex)"
        >
          <div class="rental-item-category-header">
            <div class="rental-item-category-heading">
              <span>物品分类</span>
              <h3>{{ group.categoryName }}</h3>
              <p>物品分类：{{ group.categoryName }}</p>
            </div>
            <div class="rental-item-category-summary">
              <a-tag :color="group.tagColor">{{ group.items.length }} 件</a-tag>
            </div>
          </div>

          <a-table v-if="!isMobile" row-key="id" :columns="itemColumns" :data-source="group.items" :pagination="false" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'returnedAt'">
                {{ formatDateTime(record.returnedAt) || '-' }}
              </template>
              <template v-else-if="column.key === 'returnCondition'">
                {{ returnConditionText(record.returnCondition) }}
              </template>
              <template v-else-if="column.key === 'perItemPrice'">
                {{ formatMoney(record.perItemPrice) || '-' }}
              </template>
              <template v-else-if="column.key === 'itemShortIdSnapshot'">
                <span v-if="record.itemId">{{ record.itemShortIdSnapshot }}</span>
                <a-tag v-else color="orange">待发货不确定物品</a-tag>
              </template>
            </template>
          </a-table>

          <div v-else class="rental-item-mobile-list">
            <article v-for="item in group.items" :key="item.id" class="rental-item-mobile-row">
              <div class="rental-item-mobile-title">
                <span>{{ item.itemId ? item.itemShortIdSnapshot : '待发货不确定物品' }}</span>
                <a-tag v-if="item.returnCondition" :color="item.returnCondition === 'Good' ? 'green' : 'red'">
                  {{ returnConditionText(item.returnCondition) }}
                </a-tag>
              </div>
              <div class="rental-item-mobile-name">{{ item.itemNameSnapshot || '-' }}</div>
              <div v-if="hasRentalItemMeta(item)" class="rental-item-mobile-meta">
                <span v-if="hasRentalItemPrice(item)">单价：{{ formatMoney(item.perItemPrice) }}</span>
                <span v-if="item.returnedAt">归还：{{ formatDateTime(item.returnedAt) }}</span>
              </div>
              <div v-if="item.listingRemarks" class="rental-item-mobile-remarks">平台备注：{{ item.listingRemarks }}</div>
            </article>
          </div>
        </section>
      </div>
      <a-empty v-else description="暂无商品" />

      <a-divider>物流记录</a-divider>

      <a-table v-if="!isMobile" row-key="id" :columns="shipmentColumns" :data-source="rental.shipments" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'direction'">
            <a-tag :color="record.direction === 'Outbound' ? 'blue' : 'geekblue'">
              {{ shipmentDirectionText(record.direction) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'shippedAt'">
            {{ formatDateTime(record.shippedAt) || '-' }}
          </template>
          <template v-else-if="column.key === 'deliveredAt'">
            {{ formatDateTime(record.deliveredAt) || '-' }}
          </template>
          <template v-else-if="column.key === 'shippingFee'">
            {{ formatMoney(record.shippingFee) || '-' }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button v-if="!record.deliveredAt" type="link" @click="deliver(record.id)">标记签收</a-button>
          </template>
        </template>
      </a-table>

      <div v-else class="mobile-card-list">
        <MobileListCard v-for="shipment in rental.shipments" :key="shipment.id">
          <template #title>
            {{ shipment.carrier || '未知物流' }}
            <span v-if="shipment.trackingNumber" style="color: #999; font-weight: 400"> | {{ shipment.trackingNumber }}</span>
          </template>
          <template #tags>
            <a-tag :color="shipment.direction === 'Outbound' ? 'blue' : 'geekblue'">
              {{ shipmentDirectionText(shipment.direction) }}
            </a-tag>
          </template>
          <template #meta>
            <div v-if="shipment.originWarehouseName">仓库：{{ shipment.originWarehouseName }}</div>
            <div v-if="shipment.shippingFee">运费：{{ formatMoney(shipment.shippingFee) }}</div>
            <div v-if="shipment.shippedAt">发货时间：{{ formatDateTime(shipment.shippedAt) }}</div>
            <div v-if="shipment.deliveredAt">签收时间：{{ formatDateTime(shipment.deliveredAt) }}</div>
          </template>
          <template #footer v-if="!shipment.deliveredAt">
            <a-button size="small" type="primary" @click="deliver(shipment.id)">标记签收</a-button>
          </template>
        </MobileListCard>
        <a-empty v-if="!rental.shipments?.length" description="暂无物流" />
      </div>

      <template v-if="hasSfShipments">
        <a-divider>顺丰路由</a-divider>
        <div class="sf-route-toolbar">
          <a-space wrap>
            <span class="sf-route-hint">使用 SF 运单号 + 租客手机号后四位查询，默认 2 小时后端缓存。</span>
            <a-button size="small" :loading="sfRouteLoading" @click="loadSfRoutes(true)">刷新顺丰路由</a-button>
          </a-space>
        </div>
        <a-list
          size="small"
          :loading="sfRouteLoading"
          :data-source="sfShipments"
          :locale="{ emptyText: '暂无顺丰物流' }"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  <a-space wrap>
                    <span>{{ item.trackingNumber }}</span>
                    <a-tag :color="item.direction === 'Outbound' ? 'blue' : 'cyan'">
                      {{ shipmentDirectionText(item.direction) }}
                    </a-tag>
                    <a-tag :color="sfRouteStatusColor(sfRouteForShipment(item.id))">
                      {{ sfRouteStatusText(sfRouteForShipment(item.id)) }}
                    </a-tag>
                    <a-tag v-if="sfRouteForShipment(item.id)?.fromCache">缓存</a-tag>
                  </a-space>
                </template>
                <template #description>
                  <div class="sf-route-detail">
                    <template v-if="sfRouteForShipment(item.id)">
                      <a-alert
                        v-if="sfRouteForShipment(item.id)?.hasException"
                        type="warning"
                        show-icon
                        :message="sfRouteForShipment(item.id)?.exceptionMessage || '顺丰路由存在异常，请及时跟进'"
                      />
                      <a-alert
                        v-else-if="sfRouteForShipment(item.id)?.error"
                        type="info"
                        show-icon
                        :message="sfRouteForShipment(item.id)?.error || ''"
                      />
                      <div class="sf-route-meta">
                        <span>校验尾号：{{ sfRouteForShipment(item.id)?.checkPhoneNo || '-' }}</span>
                        <span>查询：{{ formatDateTime(sfRouteForShipment(item.id)?.queriedAt) || '-' }}</span>
                        <span v-if="sfRouteForShipment(item.id)?.deliveredAt">签收：{{ formatDateTime(sfRouteForShipment(item.id)?.deliveredAt) }}</span>
                      </div>
                      <div v-if="latestSfRouteByShipment(item.id)" class="sf-route-latest">
                        最新：{{ latestSfRouteByShipment(item.id)?.acceptTime || '-' }}
                        <span v-if="latestSfRouteByShipment(item.id)?.acceptAddress"> {{ latestSfRouteByShipment(item.id)?.acceptAddress }}</span>
                        <span v-if="latestSfRouteByShipment(item.id)?.remark"> | {{ latestSfRouteByShipment(item.id)?.remark }}</span>
                      </div>
                      <div v-if="recentSfRoutes(item.id).length > 1" class="sf-route-nodes">
                        <div v-for="node in recentSfRoutes(item.id)" :key="`${item.id}-${node.acceptTime}-${node.opCode}`">
                          {{ node.acceptTime || '-' }}
                          <span v-if="node.acceptAddress"> {{ node.acceptAddress }}</span>
                          <span v-if="node.remark"> | {{ node.remark }}</span>
                        </div>
                      </div>
                    </template>
                    <span v-else>尚未查询。</span>
                  </div>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </template>
    </a-card>
  </div>

  <a-modal v-model:open="shipVisible" :title="shipModalTitle" ok-text="提交" cancel-text="取消" @ok="() => submitShip()">
    <a-form layout="vertical">
      <a-form-item :label="shipForm.direction === 'Outbound' ? '发货仓库' : '回货仓库'" required>
        <a-select v-model:value="shipForm.originWarehouseId" placeholder="选择仓库">
          <a-select-option v-for="warehouse in warehouseStore.warehouses" :key="warehouse.id" :value="warehouse.id">
            {{ warehouse.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <template v-if="shipForm.direction === 'Outbound' && uncertainRentalItems.length > 0">
        <a-divider>确定发货商品（一物一码）</a-divider>
        <div v-if="!shipForm.originWarehouseId" style="color: #ff4d4f; margin-bottom: 12px;">
          请先选择发货仓库以加载可选在库库存物品
        </div>
        <a-form-item
          v-for="ri in uncertainRentalItems"
          :key="ri.id"
          :label="`发货物品: ${ri.itemNameSnapshot || '未命名'} (项 ID: ${ri.id})`"
          required
        >
          <a-select
            v-model:value="selectedShipItems[ri.id]"
            placeholder="请选择具体物品"
            :loading="itemStore.loading"
            :disabled="!shipForm.originWarehouseId"
            show-search
            option-filter-prop="label"
          >
            <a-select-option
              v-for="item in availableItemsForDefinition(ri.itemDefinitionId)"
              :key="item.id"
              :value="item.id"
              :label="item.shortId"
            >
              {{ item.shortId }} - {{ item.remarks || '无备注' }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </template>
      <a-form-item label="物流公司" required>
        <a-auto-complete
          v-model:value="shipForm.carrier"
          :options="carrierOptions"
          placeholder="选择或输入物流公司"
          :filter-option="filterCarrier"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="运单号">
        <MobileScanInput v-model="shipForm.trackingNumber" placeholder="填写运单号" />
      </a-form-item>
      <a-form-item label="运费">
        <a-input-number v-model:value="shipForm.shippingFee" :min="0" :step="0.1" :precision="1" style="width: 100%" />
      </a-form-item>
      <a-form-item label="备注">
        <a-textarea v-model:value="shipForm.notes" :rows="2" />
      </a-form-item>
    </a-form>
  </a-modal>

  <a-modal v-model:open="returnVisible" title="登记归还" ok-text="提交" cancel-text="取消" @ok="submitReturn">
    <a-form layout="vertical">
      <a-form-item label="归还状态">
        <a-select v-model:value="returnForm.condition">
          <a-select-option value="Good">Good</a-select-option>
          <a-select-option value="MinorDamage">MinorDamage</a-select-option>
          <a-select-option value="MajorDamage">MajorDamage</a-select-option>
          <a-select-option value="Lost">Lost</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="备注">
        <a-textarea v-model:value="returnForm.notes" :rows="2" />
      </a-form-item>
    </a-form>
  </a-modal>

  <a-modal v-model:open="cancelVisible" title="取消租赁" ok-text="确认" cancel-text="取消" @ok="submitCancel">
    <a-form layout="vertical">
      <a-form-item label="取消原因">
        <a-textarea v-model:value="cancelReason" :rows="3" />
      </a-form-item>
    </a-form>
  </a-modal>

  <a-modal
    v-model:open="renewVisible"
    title="续租"
    ok-text="创建续租单"
    cancel-text="取消"
    :confirm-loading="renewing"
    @ok="submitRenew(false)"
  >
    <a-form layout="vertical">
      <a-alert
        type="info"
        show-icon
        message="续租会创建新的租赁单；原单不再要求回货物流，新单不再要求发货物流。"
        style="margin-bottom: 12px"
      />
      <a-form-item label="续租开始日期" required>
        <a-date-picker v-model:value="renewForm.startDate" style="width: 100%" />
      </a-form-item>
      <a-form-item label="续租结束日期" required>
        <a-date-picker v-model:value="renewForm.expectedEndDate" style="width: 100%" />
      </a-form-item>
      <a-form-item label="续租金额" required>
        <a-input-number v-model:value="renewForm.totalPrice" :min="0" :step="0.1" :precision="1" style="width: 100%" />
      </a-form-item>
      <a-form-item label="押金">
        <a-input-number v-model:value="renewForm.deposit" :min="0" :step="0.1" :precision="1" style="width: 100%" />
      </a-form-item>
      <a-form-item label="其他费用">
        <a-input-number v-model:value="renewForm.otherFee" :min="0" :step="0.1" :precision="1" style="width: 100%" />
      </a-form-item>
      <a-form-item label="核算金额">
        <a-input :value="formatMoney(renewAccountedAmount)" disabled />
      </a-form-item>
      <a-form-item label="备注">
        <a-textarea v-model:value="renewForm.notes" :rows="3" :maxlength="500" />
      </a-form-item>
    </a-form>
  </a-modal>

  <a-modal
    v-model:open="itemPickerVisible"
    title="修改租赁物品"
    ok-text="保存"
    cancel-text="取消"
    :width="isMobile ? 'calc(100vw - 16px)' : 620"
    :style="{ top: isMobile ? '8px' : undefined }"
    :body-style="{ padding: isMobile ? '16px 12px' : undefined }"
    wrap-class-name="rental-item-picker-modal"
    :confirm-loading="itemPickerSaving"
    @ok="submitItemPicker(false)"
  >
    <a-form layout="vertical" class="item-picker-form">
      <a-form-item v-if="canUseDefinitionItemPicker" label="修改模式">
        <a-radio-group v-model:value="itemPickerMode" button-style="solid" class="item-picker-mode">
          <a-radio-button value="item">具体物品</a-radio-button>
          <a-radio-button value="definition">物品定义</a-radio-button>
        </a-radio-group>
      </a-form-item>
      <a-alert
        v-else
        type="info"
        show-icon
        message="租赁已发货或续租进行中，修改时只能选择具体物品。"
        style="margin-bottom: 12px"
      />
      <a-form-item v-if="effectiveItemPickerMode === 'item'" label="租赁物品" required>
        <a-select
          v-model:value="selectedRentalItemIds"
          mode="multiple"
          show-search
          option-filter-prop="label"
          :options="itemPickerOptions"
          :loading="itemStore.loading"
          placeholder="选择当前租赁中需要保留/新增的物品"
          :size="isMobile ? 'large' : 'middle'"
          :max-tag-count="isMobile ? 'responsive' : undefined"
          class="item-picker-select"
        />
      </a-form-item>
      <a-form-item v-if="effectiveItemPickerMode === 'definition'" label="物品定义占位" required>
        <a-select
          v-model:value="definitionToAdd"
          show-search
          option-filter-prop="label"
          :options="itemDefinitionPickerOptions"
          :loading="itemDefinitionStore.loading"
          placeholder="选择待发货时再确定库存的物品定义"
          allow-clear
          :size="isMobile ? 'large' : 'middle'"
          class="item-picker-select"
          @select="addRentalDefinition"
        />
        <div v-if="selectedRentalDefinitionEntries.length" class="definition-picker-list">
          <div
            v-for="entry in selectedRentalDefinitionEntries"
            :key="entry.id"
            class="definition-picker-row"
          >
            <span class="definition-picker-name">{{ entry.label }}</span>
            <a-input-number
              :value="entry.quantity"
              :min="0"
              :precision="0"
              :size="isMobile ? 'large' : 'middle'"
              @change="handleRentalDefinitionQuantityChange(entry.id, $event)"
            />
            <a-button :size="isMobile ? 'large' : 'middle'" type="link" danger @click="setRentalDefinitionQuantity(entry.id, 0)">移除</a-button>
          </div>
        </div>
      </a-form-item>
      <a-alert
        type="info"
        show-icon
        :message="`当前选中 ${selectedRentalItemTotal} 件。移出的物品会结束本租赁项，新增物品会按本租期检查冲突。`"
      />
    </a-form>
  </a-modal>

  <a-modal v-model:open="editVisible" title="编辑基础信息" ok-text="保存" cancel-text="取消" :confirm-loading="saving" @ok="submitEdit(false)">
    <a-form layout="vertical">
      <a-form-item label="租客">
        <a-select
          v-model:value="editForm.renterId"
          show-search
          option-filter-prop="label"
          :options="renterOptions"
          :loading="renterStore.loading"
          placeholder="选择租客"
        />
      </a-form-item>
      <a-form-item label="开始日期">
        <a-date-picker v-model:value="editForm.startDate" style="width: 100%" />
      </a-form-item>
      <a-form-item label="预计发货日期">
        <a-date-picker v-model:value="editForm.expectedShipDate" style="width: 100%" />
      </a-form-item>
      <a-form-item label="预计结束日期">
        <a-date-picker v-model:value="editForm.expectedEndDate" style="width: 100%" />
      </a-form-item>
      <a-form-item label="续租意愿">
        <a-switch v-model:checked="editForm.hasRenewalIntent" checked-children="是" un-checked-children="否" />
      </a-form-item>
      <a-form-item label="续租意愿至" :required="editForm.hasRenewalIntent">
        <a-date-picker
          v-model:value="editForm.renewalIntentEndDate"
          style="width: 100%"
          :disabled="!editForm.hasRenewalIntent"
        />
      </a-form-item>
      <a-form-item label="总价">
        <a-input-number v-model:value="editForm.totalPrice" :min="0" :step="0.1" :precision="1" style="width: 100%" />
      </a-form-item>
      <a-form-item label="押金">
        <a-input-number v-model:value="editForm.deposit" :min="0" :step="0.1" :precision="1" style="width: 100%" />
      </a-form-item>
      <a-form-item label="其他费用">
        <a-input-number v-model:value="editForm.otherFee" :min="0" :step="0.1" :precision="1" style="width: 100%" />
      </a-form-item>
      <a-form-item label="核算金额">
        <a-input :value="formatMoney(editAccountedAmount)" disabled />
      </a-form-item>
      <a-form-item label="收货地址">
        <a-input v-model:value="editForm.shippingAddress" :maxlength="500" />
      </a-form-item>
      <a-form-item label="平台订单号">
        <a-input v-model:value="editForm.platformOrderNo" :maxlength="100" />
      </a-form-item>
      <a-form-item label="负责人">
        <a-select
          v-model:value="editForm.assignedUsers"
          mode="multiple"
          placeholder="选择负责人"
          :options="userOptions"
          :loading="userStore.loading"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="建单人">
        <a-select
          v-model:value="editForm.createdBy"
          placeholder="选择建单人"
          :options="userOptions"
          :loading="userStore.loading"
          allow-clear
          show-search
        />
      </a-form-item>
      <a-form-item label="发货人">
        <a-select
          v-model:value="editForm.senderName"
          placeholder="选择发货人"
          :options="userOptions"
          :loading="userStore.loading"
          allow-clear
          show-search
        />
      </a-form-item>
      <a-form-item label="备注">
        <a-textarea v-model:value="editForm.notes" :rows="3" :maxlength="500" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';
import { useRentalStore, type BulkUpdateRentalItemPayload, type Rental, type RentalItem, type ReturnCondition, type SettlementPreview, type SfShipmentRoute, type ShipmentDirection } from '../stores/rentalStore';
import { useWarehouseStore } from '../stores/warehouseStore';
import { useUserStore } from '../stores/userStore';
import { useRenterStore } from '../stores/renterStore';
import { useAuthStore } from '../stores/authStore';
import { useItemStore, type Item } from '../stores/itemStore';
import { useItemDefinitionStore } from '../stores/itemDefinitionStore';
import { formatDateTime } from '../utils/formatters';
import { exportToXlsx, parseXlsxFile } from '../utils/xlsx';
import { useBreakpoint } from '../composables/useBreakpoint';
import { PermissionCodes } from '../utils/permissions';
import {
  rentalDisplayStatusColor,
  rentalDisplayStatusText,
  returnConditionText,
  shipmentDirectionText,
} from '../utils/rentalDisplay';
import MobileListCard from '../components/mobile/MobileListCard.vue';
import MobileScanInput from '../components/mobile/MobileScanInput.vue';
import RenterLink from '../components/RenterLink.vue';

interface RentalScheduleConflict {
  rentalId: string;
  rentalNumber: string;
  rentalStatus: string;
  itemId: string;
  itemShortId: string;
  itemName: string;
  startDate: string;
  expectedEndDate: string;
  hasRenewalIntent?: boolean;
  renewalIntentEndDate?: string | null;
  hasOutboundShipment: boolean;
  conflictReason?: string | null;
}

interface RentalCreateConflictResponse {
  message: string;
  pendingShipmentConflicts: RentalScheduleConflict[];
  shippedConflicts: RentalScheduleConflict[];
  returnPendingConflicts?: RentalScheduleConflict[];
}

const { shouldUseMobileLayout: isMobile } = useBreakpoint();
const route = useRoute();
const router = useRouter();
const rentalStore = useRentalStore();
const warehouseStore = useWarehouseStore();
const userStore = useUserStore();
const renterStore = useRenterStore();
const authStore = useAuthStore();
const itemStore = useItemStore();
const itemDefinitionStore = useItemDefinitionStore();

const rental = ref<Rental | null>(null);
const loading = ref(false);
const routeRentalId = computed(() => {
  const raw = route.params.id;
  return Array.isArray(raw) ? raw[0] : String(raw || '');
});
const selectedShipItems = ref<Record<number, string>>({});
const uncertainRentalItems = computed(() => {
  if (shipForm.direction !== 'Outbound') return [];
  return rental.value?.items.filter(item => !item.itemId) || [];
});
const availableItemsForDefinition = (definitionId?: number | null) => {
  const warehouseId = shipForm.originWarehouseId;
  if (!warehouseId || !definitionId) return [];
  return itemStore.items.filter(item => 
    item.itemDefinitionId === definitionId &&
    item.status === 'InStock' &&
    item.warehouseId === warehouseId
  );
};
const shipVisible = ref(false);
const returnVisible = ref(false);
const cancelVisible = ref(false);
const editVisible = ref(false);
const saving = ref(false);
const importing = ref(false);
const itemPickerVisible = ref(false);
const itemPickerSaving = ref(false);
const itemPickerMode = ref<'item' | 'definition'>('item');
const selectedRentalItemIds = ref<string[]>([]);
const selectedRentalDefinitionQuantities = reactive<Record<number, number>>({});
const definitionToAdd = ref<number | undefined>(undefined);
const sfRoutes = ref<SfShipmentRoute[]>([]);
const sfRouteLoading = ref(false);
const renewVisible = ref(false);
const renewing = ref(false);
const settlementInfo = ref<SettlementPreview | null>(null);
const settlementLoading = ref(false);
//const settlementSending = ref(false);

const userOptions = computed(() =>
  userStore.users.map(user => ({ label: user.name, value: user.name }))
);

const renterOptions = computed(() =>
  renterStore.renters.map(renter => ({
    label: `${renter.name}${renter.phone ? ` / ${renter.phone}` : ''}`,
    value: renter.id,
  }))
);

const currentActiveRentalItemIds = computed(() =>
  rental.value?.items
    .filter(item => !item.returnedAt && !!item.itemId)
    .map(item => item.itemId as string) || []
);

const currentActiveRentalDefinitionQuantities = computed(() => {
  const counts: Record<number, number> = {};
  rental.value?.items
    .filter(item => !item.returnedAt && !item.itemId && !!item.itemDefinitionId)
    .forEach(item => {
      const definitionId = item.itemDefinitionId as number;
      counts[definitionId] = (counts[definitionId] || 0) + 1;
    });
  return counts;
});

const itemPickerOptions = computed(() => {
  const current = new Set(currentActiveRentalItemIds.value);
  return itemStore.items
    .filter((item: Item) => item.status !== 'Disposed' || current.has(item.id))
    .map((item: Item) => ({
      value: item.id,
      label: `${item.shortId} / ${item.itemDefinitionName || item.name || '-'} / ${item.warehouseName || '-'}`,
    }));
});

const itemDefinitionPickerOptions = computed(() =>
  itemDefinitionStore.itemDefinitions.map(definition => ({
    value: definition.id,
    label: `${definition.name} / ${definition.category?.name || '-'}`,
  }))
);

const selectedRentalDefinitionEntries = computed(() =>
  Object.entries(selectedRentalDefinitionQuantities)
    .map(([id, quantity]) => ({
      id: Number(id),
      quantity: Number(quantity || 0),
    }))
    .filter(entry => entry.id > 0 && entry.quantity > 0)
    .map(entry => {
      const definition = itemDefinitionStore.itemDefinitions.find(item => item.id === entry.id);
      return {
        ...entry,
        label: definition
          ? `${definition.name} / ${definition.category?.name || '-'}`
          : `#${entry.id}`,
      };
    })
);

const selectedRentalDefinitionIds = computed(() =>
  selectedRentalDefinitionEntries.value.flatMap(entry =>
    Array.from({ length: entry.quantity }, () => entry.id)
  )
);

const editForm = reactive({
  renterId: undefined as string | undefined,
  startDate: null as Dayjs | null,
  expectedShipDate: null as Dayjs | null,
  expectedEndDate: null as Dayjs | null,
  hasRenewalIntent: false,
  renewalIntentEndDate: null as Dayjs | null,
  totalPrice: null as number | null,
  deposit: null as number | null,
  otherFee: 0,
  shippingAddress: '',
  platformOrderNo: '',
  assignedUsers: [] as string[],
  notes: '',
  createdBy: '' as string | null,
  senderName: '' as string | null,
});

const editAccountedAmount = computed(() =>
  Number(editForm.totalPrice || 0)
  - Number(rental.value?.totalShippingFee || 0)
  - Number(editForm.otherFee || 0)
);

const renewForm = reactive({
  startDate: null as Dayjs | null,
  expectedEndDate: null as Dayjs | null,
  totalPrice: null as number | null,
  deposit: null as number | null,
  otherFee: 0,
  notes: '',
});

const renewAccountedAmount = computed(() =>
  Number(renewForm.totalPrice || 0) - Number(renewForm.otherFee || 0)
);

const rentalDays = computed(() => {
  if (!rental.value) return 1;
  const start = dayjs(formatDate(rental.value.startDate));
  const end = dayjs(formatDate(rental.value.expectedEndDate));
  if (!start.isValid() || !end.isValid()) return 1;
  return Math.max(1, end.diff(start, 'day') + 1);
});

const dailyAccountedAmount = computed(() =>
  rental.value ? Number(rental.value.accountedAmount || 0) / rentalDays.value : 0
);

const shipForm = reactive({
  direction: 'Outbound' as ShipmentDirection,
  originWarehouseId: undefined as number | undefined,
  carrier: '',
  trackingNumber: '',
  shippingFee: null as number | null,
  notes: '',
});

const returnForm = reactive({
  condition: 'Good' as ReturnCondition,
  notes: '',
});

const cancelReason = ref('');

const carrierOptions = [
  { value: '顺丰速运' },
  { value: '顺丰同城' },
  { value: '中通快递' },
  { value: '圆通速递' },
  { value: '申通快递' },
  { value: '韵达快递' },
  { value: '京东物流' },
  { value: '德邦快递' },
  { value: '邮政 EMS' },
  { value: '极兔速递' },
  { value: '菜鸟裹裹' },
  { value: '其他' },
];

const filterCarrier = (input: string, option: { value: string }) =>
  !!option.value && option.value.toLowerCase().includes(input.toLowerCase());

const itemColumns = [
  { title: '商品 ID', dataIndex: 'itemShortIdSnapshot', key: 'itemShortIdSnapshot' },
  { title: '名称', dataIndex: 'itemNameSnapshot', key: 'itemNameSnapshot' },
  { title: '单价', dataIndex: 'perItemPrice', key: 'perItemPrice', width: 120 },
  { title: '平台备注', dataIndex: 'listingRemarks', key: 'listingRemarks' },
  { title: '归还时间', dataIndex: 'returnedAt', key: 'returnedAt', width: 180 },
  { title: '归还状态', dataIndex: 'returnCondition', key: 'returnCondition', width: 140 },
];

const categoryPalette = [
  { accent: '#2563eb', soft: '#eff6ff', border: '#bfdbfe', tag: 'blue' },
  { accent: '#0f766e', soft: '#ecfdf5', border: '#99f6e4', tag: 'green' },
  { accent: '#b45309', soft: '#fffbeb', border: '#fde68a', tag: 'gold' },
  { accent: '#7c3aed', soft: '#f5f3ff', border: '#ddd6fe', tag: 'purple' },
  { accent: '#be123c', soft: '#fff1f2', border: '#fecdd3', tag: 'red' },
];

const itemDefinitionCategoryMap = computed(() =>
  itemDefinitionStore.itemDefinitions.reduce((map: Record<number, { categoryId?: number | null; categoryName: string }>, definition) => {
    map[definition.id] = {
      categoryId: definition.categoryId,
      categoryName: definition.category?.name || '',
    };
    return map;
  }, {})
);

const resolveRentalItemCategory = (item: RentalItem) => {
  const fallback = item.itemDefinitionId ? itemDefinitionCategoryMap.value[item.itemDefinitionId] : undefined;
  const categoryId = item.categoryId ?? fallback?.categoryId ?? null;
  const categoryName = item.categoryName || fallback?.categoryName || '未分类';
  return { categoryId, categoryName };
};

const rentalItemCategoryGroups = computed(() => {
  const groups: Array<{
    key: string;
    categoryName: string;
    items: RentalItem[];
    tagColor: string;
  }> = [];
  const indexByKey = new Map<string, number>();

  (rental.value?.items || []).forEach(item => {
    const category = resolveRentalItemCategory(item);
    const key = category.categoryId ? `category-${category.categoryId}` : `category-name-${category.categoryName}`;
    let groupIndex = indexByKey.get(key);
    if (groupIndex === undefined) {
      groupIndex = groups.length;
      indexByKey.set(key, groupIndex);
        groups.push({
          key,
          categoryName: category.categoryName,
          items: [],
          tagColor: categoryPalette[groupIndex % categoryPalette.length].tag,
        });
      }

      groups[groupIndex].items.push(item);
    });

  return groups;
});

const categoryGroupStyle = (index: number) => {
  const color = categoryPalette[index % categoryPalette.length];
  return {
    '--category-accent': color.accent,
    '--category-soft': color.soft,
    '--category-border': color.border,
  };
};

const shipmentColumns = [
  { title: '方向', dataIndex: 'direction', key: 'direction', width: 90 },
  { title: '仓库', dataIndex: 'originWarehouseName', key: 'originWarehouseName', width: 160 },
  { title: '物流公司', dataIndex: 'carrier', key: 'carrier', width: 140 },
  { title: '运单号', dataIndex: 'trackingNumber', key: 'trackingNumber', width: 180 },
  { title: '运费', dataIndex: 'shippingFee', key: 'shippingFee', width: 100 },
  { title: '发货时间', dataIndex: 'shippedAt', key: 'shippedAt', width: 180 },
  { title: '签收时间', dataIndex: 'deliveredAt', key: 'deliveredAt', width: 180 },
  { title: '操作', key: 'actions', width: 100 },
];

const sfRouteByShipment = computed(() => {
  const map = new Map<number, SfShipmentRoute>();
  sfRoutes.value.forEach(route => map.set(route.shipmentId, route));
  return map;
});

const sfShipments = computed(() =>
  rental.value?.shipments?.filter(shipment =>
    !!shipment.trackingNumber
    && shipment.trackingNumber.trim().toUpperCase().startsWith('SF')) || []
);

const hasSfShipments = computed(() => sfShipments.value.length > 0);

const isRentalClosed = computed(() =>
  !!rental.value && ['Returned', 'Cancelled', 'Renewed'].includes(rental.value.status)
);

const hasOutboundShipment = computed(() =>
  !!rental.value?.shipments?.some(shipment => shipment.direction === 'Outbound')
);

const isRenewal = computed(() => !!rental.value?.isRenewal);

const hasRentalStarted = computed(() =>
  isRenewal.value || hasOutboundShipment.value || rental.value?.status === 'Active' || rental.value?.status === 'Overdue'
);

const canUseDefinitionItemPicker = computed(() => !hasRentalStarted.value);

const effectiveItemPickerMode = computed<'item' | 'definition'>(() =>
  canUseDefinitionItemPicker.value ? itemPickerMode.value : 'item'
);

const selectedRentalItemTotal = computed(() =>
  effectiveItemPickerMode.value === 'definition'
    ? selectedRentalDefinitionIds.value.length
    : selectedRentalItemIds.value.length
);

const hasDeliveredOutbound = computed(() =>
  !!rental.value?.shipments?.some(shipment => shipment.direction === 'Outbound' && !!shipment.deliveredAt)
);

const canShip = computed(() => !!rental.value && !isRentalClosed.value && !isRenewal.value);
const canReceive = computed(() => !!rental.value && !isRentalClosed.value && (hasDeliveredOutbound.value || isRenewal.value));
const canReturn = computed(() => !!rental.value && !isRentalClosed.value && hasRentalStarted.value);
const canCancel = computed(() => !!rental.value && !isRentalClosed.value);
const canEdit = computed(() => !!rental.value && !isRentalClosed.value);
const canRenew = computed(() =>
  !!rental.value
  && !isRentalClosed.value
  && !rental.value.renewedToRentalId
  && ['Active', 'Overdue'].includes(rental.value.status)
  && rental.value.items.some(item => !item.returnedAt)
  && authStore.hasPermission(PermissionCodes.RentalCreate)
);

const canShowSettlementPanel = computed(() =>
  !!rental.value && ['Returned', 'Overdue', 'Renewed'].includes(rental.value.status)
);
/*
const canSendSettlement = computed(() =>
  !!settlementInfo.value?.canSend && authStore.hasPermission(PermissionCodes.RentalReturn)
); */

const canShowSettlementDetails = computed(() =>
  !!settlementInfo.value?.canSend
);

const isRenewedSettlement = computed(() =>
  rental.value?.status === 'Renewed'
);

const showActiveRenewalSettlementNotice = computed(() =>
  !!rental.value?.isRenewal && ['Active', 'Overdue'].includes(rental.value.status) && !canShowSettlementPanel.value
);

const creatorSettlementLabel = computed(() =>
  settlementInfo.value?.creatorName ? `建单（${settlementInfo.value.creatorName}）` : '建单'
);

const settlementShareLabel = (share: SettlementPreview['ownerShares'][number]) =>
  share.ownerName ? `物品所有（${share.ownerName}）` : '物品所有';

const settlementShipperShareLabel = (share: SettlementPreview['shipperShares'][number]) =>
  share.shipperName ? `发货人（${share.shipperName}）` : '发货人';

const settlementPreviewText = computed(() => {
  const text = settlementInfo.value?.markdownText?.trim();
  if (!text) return '';
  return text.replace(/^```(?:text)?\s*/i, '').replace(/\s*```$/, '');
});

const receiveDisabledReason = computed(() => {
  if (isRentalClosed.value) return '租赁单已结束，不能再登记回货物流';
  if (!hasDeliveredOutbound.value) return '请先完成发货并签收后再登记回货物流';
  return '';
});

const returnDisabledReason = computed(() => {
  if (isRentalClosed.value) return '租赁单已结束，不能再登记归还';
  if (!hasOutboundShipment.value) return '租赁尚未发货，不能直接登记归还';
  return '';
});

const shipModalTitle = computed(() =>
  shipForm.direction === 'Outbound' ? '登记发货' : '登记回货物流'
);

const formatDate = (value?: string | null) =>
  value ? formatDateTime(value, 'YYYY-MM-DD') : '';

const toPickerDate = (value?: string | null) => {
  const formatted = formatDate(value);
  return formatted ? dayjs(formatted) : null;
};

const toRentalDatePayload = (value?: Dayjs | null) => value?.format('YYYY-MM-DD');

const formatMoney = (value?: number | null) => {
  if (value === null || value === undefined) return '';
  return `￥${Number(value).toFixed(1)}`;
};

const hasRentalItemPrice = (item: RentalItem) => item.perItemPrice !== null && item.perItemPrice !== undefined;
const hasRentalItemMeta = (item: RentalItem) => hasRentalItemPrice(item) || !!item.returnedAt;

const resetShipForm = (direction: ShipmentDirection) => {
  shipForm.direction = direction;
  shipForm.originWarehouseId = undefined;
  shipForm.carrier = '';
  shipForm.trackingNumber = '';
  shipForm.shippingFee = null;
  shipForm.notes = '';
};

const openOutbound = async () => {
  resetShipForm('Outbound');
  selectedShipItems.value = {};
  shipVisible.value = true;
  await itemStore.fetchItems();
};

const openInbound = () => {
  resetShipForm('Inbound');
  shipVisible.value = true;
};

const openRenew = () => {
  if (!rental.value) return;
  const startDate = toPickerDate(rental.value.expectedEndDate)?.add(1, 'day') || dayjs();
  renewForm.startDate = startDate;
  renewForm.expectedEndDate = startDate.add(Math.max(0, rentalDays.value - 1), 'day');
  renewForm.totalPrice = rental.value.totalPrice ?? null;
  renewForm.deposit = rental.value.deposit ?? null;
  renewForm.otherFee = 0;
  renewForm.notes = '';
  renewVisible.value = true;
};

const loadSettlementInfo = async (id = rental.value?.id) => {
  if (!id) return;
  if (!canShowSettlementPanel.value) {
    settlementInfo.value = null;
    return;
  }

  settlementLoading.value = true;
  try {
    settlementInfo.value = await rentalStore.fetchSettlement(id);
  } catch (err: any) {
    settlementInfo.value = null;
    message.error(err?.response?.data || err?.message || '获取结算信息失败');
  } finally {
    settlementLoading.value = false;
  }
};
/*
const confirmSendSettlement = () => {
  if (!rental.value || !settlementInfo.value) return;

  Modal.confirm({
    title: settlementInfo.value.settlementNotifiedAt ? '重新发送结算信息？' : '发送结算信息？',
    content: `将按当前最新结算比例重新计算 ${rental.value.rentalNumber} 的结算信息，并发送到钉钉群。`,
    okText: '发送',
    cancelText: '取消',
    async onOk() {
      await sendSettlement();
    },
  });
};
*/
/*
const sendSettlement = async () => {
  if (!rental.value) return;

  settlementSending.value = true;
  try {
    settlementInfo.value = await rentalStore.sendSettlement(rental.value.id);
    message.success('结算信息已发送');
    await load();
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '发送结算信息失败');
  } finally {
    settlementSending.value = false;
  }
};
*/

const load = async (id = routeRentalId.value) => {
  if (!id) return;
  loading.value = true;
  try {
    rental.value = await rentalStore.getRental(id);
    if (canShowSettlementPanel.value) {
      await loadSettlementInfo(id);
    } else {
      settlementInfo.value = null;
    }
  } finally {
    loading.value = false;
  }
};

const loadSfRoutes = async (refresh = false) => {
  if (!rental.value) return;
  if (!hasSfShipments.value) {
    sfRoutes.value = [];
    return;
  }

  sfRouteLoading.value = true;
  try {
    const result = await rentalStore.fetchSfRoutes(rental.value.id, refresh);
    sfRoutes.value = result.shipments;
    if (result.rental) {
      rental.value = result.rental;
    }

    if (refresh) {
      message.success('顺丰路由已刷新');
    }
    if (result.shipments.some(item => item.autoDelivered)) {
      message.success('顺丰已签收的物流已自动标记签收');
    }
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '顺丰路由查询失败');
  } finally {
    sfRouteLoading.value = false;
  }
};

const latestSfRoute = (route: SfShipmentRoute) => route.routes?.[route.routes.length - 1];

const sfRouteForShipment = (shipmentId: number) => sfRouteByShipment.value.get(shipmentId);

const latestSfRouteByShipment = (shipmentId: number) => {
  const route = sfRouteForShipment(shipmentId);
  return route ? latestSfRoute(route) : undefined;
};

const recentSfRoutes = (shipmentId: number) =>
  [...(sfRouteForShipment(shipmentId)?.routes || [])].slice(-5).reverse();

const sfRouteStatusColor = (route?: SfShipmentRoute) => {
  if (!route || route.error || !route.queryable) return 'default';
  if (route.hasException) return 'red';
  if (route.deliveredAt) return 'green';
  if (route.routes.length > 0) return 'blue';
  return 'orange';
};

const sfRouteStatusText = (route?: SfShipmentRoute) => {
  if (!route) return '未查询';
  if (!route.queryable) return '不可查询';
  if (route.error) return '查询失败';
  if (route.hasException) return '物流异常';
  if (route.deliveredAt) return route.autoDelivered ? '已自动签收' : '已签收';
  if (route.routes.length > 0) return '运输中';
  return '暂无路由';
};

const submitShip = async (allowOpenItemConflict = false) => {
  if (!rental.value) return;
  if (!shipForm.originWarehouseId || !shipForm.carrier.trim()) {
    message.error('请填写仓库和物流公司');
    return;
  }

  // Validate item mappings for outbound
  if (shipForm.direction === 'Outbound' && uncertainRentalItems.value.length > 0) {
    for (const ri of uncertainRentalItems.value) {
      if (!selectedShipItems.value[ri.id]) {
        message.error(`请为“${ri.itemNameSnapshot}”选择发货的具体物品`);
        return;
      }
    }
  }

  const itemSelections = Object.entries(selectedShipItems.value).map(([rentalItemId, itemId]) => ({
    rentalItemId: Number(rentalItemId),
    itemId,
  }));

  try {
    await rentalStore.ship(rental.value.id, {
      direction: shipForm.direction,
      originWarehouseId: shipForm.originWarehouseId,
      carrier: shipForm.carrier.trim(),
      trackingNumber: shipForm.trackingNumber.trim() || undefined,
      shippingFee: shipForm.shippingFee,
      notes: shipForm.notes.trim() || undefined,
      allowOpenItemConflict,
      itemSelections,
    });
    shipVisible.value = false;
    message.success(shipForm.direction === 'Outbound' ? '发货登记成功' : '回货物流登记成功');
    await load();
    await loadSfRoutes(true);
  } catch (err: any) {
    if (err?.response?.status === 409 && err?.response?.data && shipForm.direction === 'Outbound') {
      showShipmentConflictConfirm(err.response.data as RentalCreateConflictResponse);
      return;
    }

    message.error(err?.response?.data || err?.message || '提交失败');
  }
};

const deliver = async (shipmentId: number) => {
  if (!rental.value) return;

  try {
    await rentalStore.deliver(rental.value.id, shipmentId, {});
    message.success('已标记签收');
    await load();
    await loadSfRoutes(false);
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '操作失败');
  }
};

const submitReturn = async () => {
  if (!rental.value) return;

  try {
    await rentalStore.returnRental(rental.value.id, {
      condition: returnForm.condition,
      notes: returnForm.notes.trim() || undefined,
    });
    returnVisible.value = false;
    message.success('归还登记成功');
    await load();
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '归还失败');
  }
};

const submitCancel = async () => {
  if (!rental.value) return;

  try {
    await rentalStore.cancel(rental.value.id, cancelReason.value.trim() || undefined);
    cancelVisible.value = false;
    message.success('租赁已取消');
    await load();
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '取消失败');
  }
};

const resetSelectedRentalDefinitions = (counts: Record<number, number>) => {
  Object.keys(selectedRentalDefinitionQuantities).forEach(id => {
    delete selectedRentalDefinitionQuantities[Number(id)];
  });
  Object.entries(counts).forEach(([id, quantity]) => {
    const definitionId = Number(id);
    if (definitionId > 0 && quantity > 0) {
      selectedRentalDefinitionQuantities[definitionId] = quantity;
    }
  });
};

const setRentalDefinitionQuantity = (definitionId: number, quantity: number) => {
  const next = Math.max(0, Math.floor(Number(quantity || 0)));
  if (next <= 0) {
    delete selectedRentalDefinitionQuantities[definitionId];
    return;
  }
  selectedRentalDefinitionQuantities[definitionId] = next;
};

const handleRentalDefinitionQuantityChange = (
  definitionId: number,
  value: number | string | null
) => {
  setRentalDefinitionQuantity(definitionId, Number(value || 0));
};

const addRentalDefinition = (definitionId: number) => {
  setRentalDefinitionQuantity(
    definitionId,
    (selectedRentalDefinitionQuantities[definitionId] || 0) + 1
  );
  definitionToAdd.value = undefined;
};

const openItemPicker = async () => {
  if (!rental.value) return;
  selectedRentalItemIds.value = [...currentActiveRentalItemIds.value];
  resetSelectedRentalDefinitions(currentActiveRentalDefinitionQuantities.value);
  definitionToAdd.value = undefined;
  itemPickerMode.value = !hasRentalStarted.value
    && currentActiveRentalItemIds.value.length === 0
    && selectedRentalDefinitionIds.value.length > 0
      ? 'definition'
      : 'item';
  itemPickerVisible.value = true;
  await Promise.all([
    itemStore.fetchItems(),
    itemDefinitionStore.fetchItemDefinitions(),
  ]);
};

const conflictLines = (payload: RentalCreateConflictResponse) => {
  const lines: string[] = [payload.message];
  const conflictEndText = (conflict: RentalScheduleConflict) => {
    const end = formatDate(conflict.expectedEndDate);
    if (conflict.hasRenewalIntent && conflict.renewalIntentEndDate) {
      return `${end}，续租意愿至 ${formatDate(conflict.renewalIntentEndDate)}`;
    }
    return end;
  };
  const append = (title: string, items: RentalScheduleConflict[]) => {
    if (items.length === 0) return;
    lines.push('', title);
    items.forEach(conflict => {
      const reason = conflict.conflictReason ? ` / ${conflict.conflictReason}` : '';
      lines.push(
        `- ${conflict.itemShortId} / ${conflict.itemName}：${conflict.rentalNumber}（${formatDate(conflict.startDate)} ~ ${conflictEndText(conflict)}）${reason}`
      );
    });
  };
  append('未发货订单冲突：', payload.pendingShipmentConflicts);
  append('已发货订单冲突：', payload.shippedConflicts);
  append('回货未签收冲突：', payload.returnPendingConflicts || []);
  return lines.join('\n');
};

const showShipmentConflictConfirm = (payload: RentalCreateConflictResponse) => {
  Modal.confirm({
    title: '发货物品仍被其他租赁单占用',
    width: 720,
    okText: '仍然发货',
    cancelText: '返回检查',
    content: conflictLines(payload),
    async onOk() {
      await submitShip(true);
    },
  });
};

const showItemConflictConfirm = (payload: RentalCreateConflictResponse) => {
  Modal.confirm({
    title: '新增物品存在租赁时间冲突',
    width: 720,
    okText: '仍然保存',
    cancelText: '返回修改',
    content: conflictLines(payload),
    async onOk() {
      await submitItemPicker(true);
    },
  });
};

const showRenewConflictConfirm = (payload: RentalCreateConflictResponse) => {
  Modal.confirm({
    title: '续租时间存在冲突',
    width: 720,
    okText: '仍然创建续租单',
    cancelText: '返回修改',
    content: conflictLines(payload),
    async onOk() {
      await submitRenew(true);
    },
  });
};

const showEditConflictConfirm = (payload: RentalCreateConflictResponse) => {
  Modal.confirm({
    title: '租赁时间或续租意愿存在冲突',
    width: 720,
    okText: '仍然保存',
    cancelText: '返回修改',
    content: conflictLines(payload),
    async onOk() {
      await submitEdit(true);
    },
  });
};

const submitRenew = async (allowScheduleConflict: boolean) => {
  if (!rental.value) return;
  if (!renewForm.startDate || !renewForm.expectedEndDate) {
    message.error('请选择续租开始日期和结束日期');
    return;
  }

  if (renewForm.expectedEndDate.isBefore(renewForm.startDate, 'day')) {
    message.error('续租结束日期不能早于开始日期');
    return;
  }

  if (renewForm.totalPrice === null || renewForm.totalPrice === undefined) {
    message.error('请填写续租金额');
    return;
  }

  renewing.value = true;
  try {
    const result = await rentalStore.renewRental(rental.value.id, {
      startDate: toRentalDatePayload(renewForm.startDate),
      expectedEndDate: toRentalDatePayload(renewForm.expectedEndDate)!,
      totalPrice: Number(renewForm.totalPrice || 0),
      deposit: renewForm.deposit,
      otherFee: Number(renewForm.otherFee || 0),
      notes: renewForm.notes.trim() || undefined,
      allowScheduleConflict,
    });

    renewVisible.value = false;
    message.success('续租单已创建');

    if (result.renewalRental) {
      rental.value = result.renewalRental;
      sfRoutes.value = [];
      await router.push(`/rentals/${result.renewalRental.id}`);
    } else {
      await load();
    }
  } catch (err: any) {
    if (err?.response?.status === 409 && err?.response?.data) {
      showRenewConflictConfirm(err.response.data as RentalCreateConflictResponse);
      return;
    }

    message.error(err?.response?.data || err?.message || '续租失败');
  } finally {
    renewing.value = false;
  }
};

const submitItemPicker = async (allowScheduleConflict: boolean) => {
  if (!rental.value) return;
  if (selectedRentalItemTotal.value === 0) {
    message.error('至少保留一件租赁物品');
    return;
  }

  itemPickerSaving.value = true;
  try {
    const useDefinitionMode = effectiveItemPickerMode.value === 'definition';
    rental.value = await rentalStore.updateRentalItems(rental.value.id, {
      itemIds: useDefinitionMode ? [] : selectedRentalItemIds.value,
      itemDefinitionIds: useDefinitionMode ? selectedRentalDefinitionIds.value : [],
      allowScheduleConflict,
    });
    itemPickerVisible.value = false;
    message.success('租赁物品已更新');
    await load();
  } catch (err: any) {
    if (err?.response?.status === 409 && err?.response?.data) {
      showItemConflictConfirm(err.response.data as RentalCreateConflictResponse);
      return;
    }

    message.error(err?.response?.data || err?.message || '租赁物品更新失败');
  } finally {
    itemPickerSaving.value = false;
  }
};

const openEdit = () => {
  if (!rental.value) return;
  editForm.expectedEndDate = toPickerDate(rental.value.expectedEndDate);
  editForm.expectedShipDate = toPickerDate(rental.value.expectedShipDate);
  editForm.startDate = toPickerDate(rental.value.startDate);
  editForm.hasRenewalIntent = !!rental.value.hasRenewalIntent;
  editForm.renewalIntentEndDate = rental.value.renewalIntentEndDate ? toPickerDate(rental.value.renewalIntentEndDate) : null;
  editForm.renterId = rental.value.renterId;
  editForm.totalPrice = rental.value.totalPrice ?? null;
  editForm.deposit = rental.value.deposit ?? null;
  editForm.otherFee = rental.value.otherFee ?? 0;
  editForm.shippingAddress = rental.value.shippingAddress || '';
  editForm.platformOrderNo = rental.value.platformOrderNo || '';
  editForm.assignedUsers = (rental.value.assignedTo || '')
    .split(/[,;，；]/)
    .map(value => value.trim())
    .filter(Boolean);
  editForm.notes = rental.value.notes || '';
  editForm.createdBy = rental.value.createdBy || '';
  editForm.senderName = rental.value.senderName || '';
  editVisible.value = true;
};

const submitEdit = async (allowScheduleConflict = false) => {
  if (!rental.value) return;
  if (!editForm.startDate || !editForm.expectedEndDate) {
    message.error('开始日期和预计结束日期不能为空');
    return;
  }

  if (!editForm.expectedShipDate) {
    message.error('预计发货日期不能为空');
    return;
  }

  if (editForm.hasRenewalIntent && !editForm.renewalIntentEndDate) {
    message.error('请选择续租意愿日期');
    return;
  }

  if (!editForm.renterId) {
    message.error('请选择租客');
    return;
  }

  saving.value = true;
  try {
    await rentalStore.updateRental(rental.value.id, {
      renterId: editForm.renterId,
      startDate: toRentalDatePayload(editForm.startDate),
      expectedShipDate: toRentalDatePayload(editForm.expectedShipDate),
      expectedEndDate: toRentalDatePayload(editForm.expectedEndDate),
      hasRenewalIntent: editForm.hasRenewalIntent,
      renewalIntentEndDate: editForm.hasRenewalIntent ? toRentalDatePayload(editForm.renewalIntentEndDate) : null,
      totalPrice: editForm.totalPrice ?? undefined,
      deposit: editForm.deposit,
      otherFee: editForm.otherFee,
      shippingAddress: editForm.shippingAddress.trim(),
      platformOrderNo: editForm.platformOrderNo.trim(),
      notes: editForm.notes.trim(),
      assignedTo: editForm.assignedUsers.join(','),
      createdBy: editForm.createdBy || undefined,
      senderName: editForm.senderName || undefined,
      allowScheduleConflict,
    });
    editVisible.value = false;
    message.success('已保存');
    await load();
  } catch (err: any) {
    if (err?.response?.status === 409 && err?.response?.data) {
      showEditConflictConfirm(err.response.data as RentalCreateConflictResponse);
      return;
    }

    message.error(err?.response?.data || err?.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const exportItemsXlsx = () => {
  if (!rental.value) return;

  const rows = rental.value.items.map(item => ({
    RentalItemId: item.id,
    商品ID: item.itemShortIdSnapshot || '',
    名称: item.itemNameSnapshot || '',
    单价: item.perItemPrice ?? '',
    平台备注: item.listingRemarks || '',
    归还时间: formatDateTime(item.returnedAt) || '',
    归还状态: returnConditionText(item.returnCondition),
  }));

  const filename = `租赁商品-${rental.value.rentalNumber}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  exportToXlsx(rows, filename, '租赁商品');
};

const downloadItemsTemplate = () => {
  if (!rental.value) return;

  const rows = rental.value.items.map(item => ({
    RentalItemId: item.id,
    商品ID: item.itemShortIdSnapshot || '',
    名称: item.itemNameSnapshot || '',
    单价: item.perItemPrice ?? '',
    平台备注: item.listingRemarks || '',
  }));

  exportToXlsx(rows, `租赁商品模板-${rental.value.rentalNumber}.xlsx`, '租赁商品');
};

const importItemsXlsx = async (file: File) => {
  if (!rental.value) return false;

  importing.value = true;
  try {
    const raw = await parseXlsxFile<Record<string, any>>(file);
    const updates: BulkUpdateRentalItemPayload[] = [];

    for (const row of raw) {
      const idRaw = row.RentalItemId ?? row.rentalItemId ?? row.ID ?? row.id;
      const rentalItemId = Number(idRaw);
      if (!Number.isFinite(rentalItemId) || rentalItemId <= 0) continue;

      const payload: BulkUpdateRentalItemPayload = { rentalItemId };
      const remarksRaw = row['平台备注'] ?? row.listingRemarks;
      if (remarksRaw !== undefined) {
        payload.listingRemarks = String(remarksRaw ?? '').trim();
      }

      const priceRaw = row['单价'] ?? row.perItemPrice;
      if (priceRaw !== undefined && priceRaw !== '' && priceRaw !== null) {
        const price = Number(priceRaw);
        if (Number.isFinite(price) && price >= 0) {
          payload.perItemPrice = price;
        }
      }

      updates.push(payload);
    }

    if (updates.length === 0) {
      message.warning('没有可导入的数据，请检查 RentalItemId 列');
      return false;
    }

    await rentalStore.bulkUpdateItems(rental.value.id, updates);
    message.success(`已更新 ${updates.length} 条商品数据`);
    await load();
  } catch (err: any) {
    message.error(err?.response?.data || err?.message || '导入失败');
  } finally {
    importing.value = false;
  }

  return false;
};

onMounted(async () => {
  await Promise.all([
    warehouseStore.fetchWarehouses(),
    userStore.fetchUsers({ status: 'Active', limit: 200 }),
    renterStore.fetchRenters('', 300),
    itemDefinitionStore.fetchItemDefinitions(),
  ]);
});

watch(
  () => editForm.hasRenewalIntent,
  hasRenewalIntent => {
    if (!hasRenewalIntent) {
      editForm.renewalIntentEndDate = null;
    } else if (!editForm.renewalIntentEndDate) {
      editForm.renewalIntentEndDate = editForm.expectedEndDate;
    }
  }
);

watch(
  () => route.params.id,
  async () => {
    await load();
    await loadSfRoutes(false);
  },
  { immediate: true }
);
</script>

<style scoped>
.rental-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.rental-actions :deep(.ant-btn) {
  min-width: 120px;
}

.definition-picker-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.definition-picker-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px auto;
  align-items: center;
  gap: 8px;
}

.definition-picker-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rental-mobile-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rental-mobile-hero {
  padding: 14px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 72%);
}

.rental-mobile-hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.rental-mobile-number {
  min-width: 0;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  overflow-wrap: anywhere;
}

.rental-mobile-status {
  flex-shrink: 0;
  margin-inline-end: 0;
  font-weight: 600;
}

.rental-mobile-renter {
  margin-top: 10px;
  color: #111827;
  font-size: 20px;
  line-height: 1.25;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.rental-mobile-period,
.rental-mobile-hero-meta {
  color: #475569;
  font-size: 13px;
  line-height: 1.55;
}

.rental-mobile-period {
  margin-top: 6px;
}

.rental-mobile-hero-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(37, 99, 235, 0.14);
}

.rental-mobile-hero-meta span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.rental-mobile-money-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.rental-mobile-money-card {
  min-width: 0;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.rental-mobile-money-card.primary {
  grid-column: 1 / -1;
  border-color: #bfdbfe;
  background: #eff6ff;
}

.rental-mobile-money-card span,
.rental-mobile-key-values span {
  display: block;
  color: #667085;
  font-size: 12px;
  line-height: 1.35;
}

.rental-mobile-money-card strong {
  display: block;
  margin-top: 5px;
  color: #111827;
  font-size: 17px;
  line-height: 1.25;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.rental-mobile-info-section {
  padding: 12px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background: #fff;
}

.rental-mobile-section-title {
  margin-bottom: 10px;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 700;
}

.rental-mobile-key-values {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.rental-mobile-key-values > div {
  min-width: 0;
}

.rental-mobile-key-values > div.full {
  grid-column: 1 / -1;
}

.rental-mobile-key-values strong {
  display: block;
  margin-top: 4px;
  color: #111827;
  font-size: 13px;
  line-height: 1.45;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.rental-mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.rental-primary-actions,
.rental-secondary-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.rental-primary-actions > *,
.rental-secondary-actions > * {
  width: 100%;
  min-width: 0;
}

.rental-primary-actions > *:last-child:nth-child(odd),
.rental-secondary-actions > *:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}

.rental-primary-actions :deep(.ant-btn),
.rental-secondary-actions :deep(.ant-btn) {
  width: 100%;
  min-width: 0;
}

.rental-mobile-toolbar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.rental-mobile-toolbar > *,
.rental-mobile-upload :deep(.ant-upload),
.rental-mobile-upload :deep(.ant-btn) {
  width: 100%;
  min-width: 0;
}

.rental-item-category-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rental-item-category-section {
  overflow: hidden;
  border: 1px solid var(--category-border);
  border-left: 5px solid var(--category-accent);
  border-radius: 8px;
  background: #fff;
}

.rental-item-category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background: var(--category-soft);
  border-bottom: 1px solid var(--category-border);
}

.rental-item-category-heading {
  min-width: 0;
}

.rental-item-category-heading span {
  display: block;
  color: var(--category-accent);
  font-size: 12px;
  line-height: 1.3;
  font-weight: 700;
}

.rental-item-category-heading h3 {
  margin: 3px 0 0;
  color: #111827;
  font-size: 18px;
  line-height: 1.35;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.rental-item-category-heading p {
  margin: 3px 0 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.rental-item-category-summary {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.rental-item-category-section :deep(.ant-table-wrapper) {
  padding: 12px;
}

.rental-item-mobile-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}

.rental-item-mobile-row {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.rental-item-mobile-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  color: #111827;
  font-size: 13px;
  line-height: 1.35;
  font-weight: 700;
}

.rental-item-mobile-title span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.rental-item-mobile-title :deep(.ant-tag) {
  flex-shrink: 0;
  margin-inline-end: 0;
}

.rental-item-mobile-name {
  margin-top: 5px;
  color: #1f2937;
  font-size: 15px;
  line-height: 1.4;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.rental-item-mobile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 7px;
  color: #475569;
  font-size: 12px;
  line-height: 1.45;
}

.rental-item-mobile-remarks {
  margin-top: 7px;
  color: #475569;
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.sf-route-toolbar {
  margin-bottom: 8px;
}

.sf-route-hint,
.sf-route-meta,
.sf-route-nodes {
  color: #697386;
  font-size: 12px;
}

.sf-route-detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sf-route-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.sf-route-latest {
  color: #1f2937;
}

.settlement-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settlement-header {
  display: flex;
  justify-content: flex-end;
}

.settlement-header :deep(.ant-space),
.settlement-header :deep(.ant-space-item:last-child) {
  width: auto;
}

.settlement-preview {
  margin: 0;
  padding: 12px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background: #fbfcfe;
  color: #111827;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.sf-route-nodes {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

@media (max-width: 767.98px) {
  :global(.rental-item-picker-modal .ant-modal) {
    max-width: calc(100vw - 16px);
    margin: 0 auto;
  }

  :global(.rental-item-picker-modal .ant-modal-content) {
    display: flex;
    max-height: calc(100vh - 16px);
    flex-direction: column;
  }

  :global(.rental-item-picker-modal .ant-modal-body) {
    max-height: calc(100vh - 170px);
    overflow-y: auto;
  }

  :global(.rental-item-picker-modal .ant-modal-footer) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  :global(.rental-item-picker-modal .ant-modal-footer .ant-btn) {
    width: 100%;
    min-height: 40px;
    margin: 0;
  }

  .item-picker-mode {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .item-picker-mode :deep(.ant-radio-button-wrapper) {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 40px;
    padding: 0 8px;
    text-align: center;
  }

  .item-picker-select :deep(.ant-select-selector) {
    min-height: 40px;
  }

  .definition-picker-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
  }

  .definition-picker-row .definition-picker-name {
    grid-column: 1 / -1;
  }

  .rental-detail-card :deep(.ant-card-body) {
    padding-bottom: 14px !important;
  }

  .rental-detail-card :deep(.ant-divider) {
    margin: 16px 0;
  }

  .rental-item-category-list {
    gap: 10px;
  }

  .rental-item-category-section {
    border-left-width: 4px;
  }

  .rental-item-category-header {
    align-items: flex-start;
    padding: 12px;
  }

  .rental-item-category-heading h3 {
    font-size: 16px;
  }

  .rental-item-category-summary {
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
  }

  .settlement-header {
    justify-content: stretch;
  }

  .settlement-header :deep(.ant-space),
  .settlement-header :deep(.ant-space-item),
  .settlement-header :deep(.ant-btn) {
    width: 100%;
  }

  .sf-route-toolbar :deep(.ant-space),
  .sf-route-toolbar :deep(.ant-space-item),
  .sf-route-toolbar :deep(.ant-btn) {
    width: 100%;
  }
}
</style>
